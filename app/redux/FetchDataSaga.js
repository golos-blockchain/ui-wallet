import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';
import cookie from "react-cookie";
import {config, api} from 'golos-lib-js';

import { getPinnedPosts, getMutedInNew } from 'app/utils/NormalizeProfile';
import {loadFollows, fetchFollowCount} from 'app/redux/FollowSaga';
import { getBlockings, listBlockings } from 'app/redux/BlockingSaga'
import { contentPrefs as prefs } from 'app/utils/Allowance'
import {getContent} from 'app/redux/SagaShared';
import GlobalReducer from './GlobalReducer';
import constants from './constants';
import { reveseTag, getFilterTags } from 'app/utils/tags';
import { CATEGORIES, SELECT_TAGS_KEY, DEBT_TOKEN_SHORT, LIQUID_TICKER } from 'app/client_config';
import { SearchRequest, searchData, stateSetVersion } from 'app/utils/SearchClient'

export function* fetchDataWatches () {
    yield fork(watchLocationChange);
    yield fork(watchDataRequests);
    yield fork(watchFetchJsonRequests);
    yield fork(watchFetchState);
    yield fork(watchGetContent);
    yield fork(watchFetchExchangeRates);
    yield fork(watchFetchVestingDelegations);
    yield fork(watchFetchUiaBalances);
}

export function* watchGetContent() {
    yield takeEvery('GET_CONTENT', getContentCaller);
}

export function* getContentCaller(action) {
    yield getContent(action.payload);
}

export function* watchLocationChange() {
    yield takeLatest('@@router/LOCATION_CHANGE', fetchState);
}

export function* watchFetchState() {
    yield takeLatest('FETCH_STATE', fetchState);
}

let is_initial_state = true;
export function* fetchState(location_change_action) {
    const curUser = localStorage.getItem('invite')
    const {pathname} = location_change_action.payload;
    const m = pathname.match(/^\/@([a-z0-9\.-]+)/)
    if(m && m.length === 2) {
        const username = m[1]
        yield fork(fetchFollowCount, username)
        yield fork(loadFollows, "getFollowersAsync", username, 'blog')
        yield fork(loadFollows, "getFollowingAsync", username, 'blog')
        if (curUser) {
            yield fork(getBlockings, curUser, [username])
        }
    }

    // `ignore_fetch` case should only trigger on initial page load. No need to call
    // fetchState immediately after loading fresh state from the server. Details: #593
    const server_location = yield select(state => state.offchain.get('server_location'))
    //const ignore_fetch = (pathname === server_location && is_initial_state)
    is_initial_state = false
    //if(ignore_fetch) return

    let url = `${pathname}`
    url = url.split('?')[0]
    if (url === '/') url = 'trending'
    // Replace these URLs with /transfers for UserProfile to resolve data correctly
    if (url.indexOf("/curation-rewards") !== -1) url = url.replace("/curation-rewards", "/transfers")
    if (url.indexOf("/author-rewards") !== -1) url = url.replace("/author-rewards", "/transfers")
    if (url.indexOf("/donates-from") !== -1) url = url.replace("/donates-from", "/transfers")
    if (url.indexOf("/donates-to") !== -1) url = url.replace("/donates-to", "/transfers")

    yield put({type: 'FETCH_DATA_BEGIN'})
    try {
        if (!url || typeof url !== 'string' || !url.length || url === '/') url = 'trending'
        if (url[0] === '/') url = url.substr(1)
        const parts = url.split('/')
        const tag = typeof parts[1] !== "undefined" ? parts[1] : ''

        const state = {}
        state.current_route = location
        state.content = {}
        state.assets = {}
        state.worker_requests = {}
        state.accounts = {}
        state.props = yield call([api, api.getDynamicGlobalProperties])

        let accounts = new Set()

        if (parts[0][0] === '@') {
            const uname = parts[0].substr(1)
            const [ account ] = yield call([api, api.getAccountsAsync], [uname])
            state.accounts[uname] = account
            
            if (account) {
                switch (parts[1]) {
                    case 'create-asset':
                    case 'assets':
                        state.assets = (yield call([api, api.getAccountsBalancesAsync], [uname]))[0]
                        const my_assets = yield call([api, api.getAssetsAsync], '', [], '', 5000)
                        my_assets.forEach(ma => {
                            const sym = ma.supply.split(' ')[1]
                            const precision = ma.supply.split(' ')[0].split('.')[1].length

                            if (sym in state.assets) {
                                state.assets[sym].my = true
                            } else {
                                state.assets[sym] = {
                                    balance: '0.' + '0'.repeat(precision) + ' ' + sym,
                                    tip_balance: '0.' + '0'.repeat(precision) + ' ' + sym
                                }
                            }

                            state.assets[sym] = {...state.assets[sym], ...ma, precision}

                            if (ma.creator == uname) {
                                state.assets[sym].my = true
                            }
                        })

                        state.cprops = yield call([api, api.getChainPropertiesAsync])
                    break

                    case 'invites':
                        state.cprops = yield call([api, api.getChainPropertiesAsync])
                    break

                    case 'filled-orders':
                        const fohistory = yield call([api, api.getAccountHistoryAsync], uname, -1, 1000, {select_ops: ['fill_order']});
                        account.filled_orders = [];
                        fohistory.forEach(operation => {
                            const op = operation[1].op;
                            if (op[0] === 'fill_order') {
                                state.accounts[uname].filled_orders.push(operation);
                            }
                        });
                    break
                    case 'transfers':
                    default:
                        const history = yield call([api, api.getAccountHistoryAsync], uname, -1, 1000, {select_ops: ['donate', 'transfer', 'author_reward', 'curation_reward', 'transfer_to_tip', 'transfer_from_tip', 'transfer_to_vesting', 'withdraw_vesting', 'asset_issue', 'invite', 'transfer_to_savings', 'transfer_from_savings', 'convert_sbd_debt', 'convert', 'fill_convert_request', 'interest', 'worker_reward', 'account_freeze', 'unwanted_cost', 'unlimit_cost']})
                        account.transfer_history = []
                        account.other_history = []

                        state.cprops = yield call([api, api.getChainPropertiesAsync])                        
                        history.forEach(operation => {
                            switch (operation[1].op[0]) {
                                case 'donate':
                                case 'transfer':
                                case 'author_reward':
                                case 'curation_reward':
                                case 'transfer_to_tip':
                                case 'transfer_from_tip':
                                case 'transfer_to_vesting':
                                case 'withdraw_vesting':
                                case 'asset_issue':
                                case 'invite':
                                case 'transfer_to_savings':
                                case 'transfer_from_savings':
                                case 'convert_sbd_debt':
                                case 'convert':
                                case 'fill_convert_request':
                                case 'interest':
                                case 'worker_reward':
                                case 'account_freeze':
                                case 'unwanted_cost':
                                case 'unlimit_cost':
                                    state.accounts[uname].transfer_history.push(operation)
                                break

                                default:
                                    state.accounts[uname].other_history.push(operation)
                            }
                        })
                    break
                }
            }

        } else if (parts[0] === 'witnesses' || parts[0] === '~witnesses') {
            state.witnesses = {};

            let witnessIds = [];
            const witnesses = yield call([api, api.getWitnessesByVoteAsync], '', 100);
            witnesses.forEach(witness => {
                state.witnesses[witness.owner] = witness;
                witnessIds.push(witness.id);
            });

            const voteMap = yield call([api, api.getWitnessVotesAsync], witnessIds, 21, 0, '1.000 GOLOS');
            witnesses.forEach(witness => {
                let voteList = voteMap[witness.id];
                state.witnesses[witness.owner].vote_list = voteList || [];
            });
        }  else if (parts[0] === 'workers') {
            accounts.add('workers');
            state.cprops = yield call([api, api.getChainPropertiesAsync])

            if (parts.length === 4) {
                const author = parts[2].substr(1);
                const permlink = parts[3];
                const url = `${author}/${permlink}`;
                const query = {
                  limit: 1,
                  start_author: author,
                  start_permlink: permlink
                };
                const [ wr ] = yield call([api, api.getWorkerRequestsAsync], query, 'by_created', true);
                state.worker_requests[url] = wr;

                const votes = yield call([api, api.getWorkerRequestVotesAsync], author, permlink, '', 50);
                state.worker_requests[url].votes = votes;

                if (curUser) {
                    const [ myVote ] = yield call([api, api.getWorkerRequestVotesAsync], author, permlink, curUser, 1);
                    state.worker_requests[url].myVote = (myVote && myVote.voter == curUser) ? myVote : null
                }
            }
        }

        if (accounts.size > 0) {
                    console.time('accs');
            const acc = yield call([api, api.getAccountsAsync], Array.from(accounts))
                    console.timeEnd('accs');
            for (let i in acc) {
                state.accounts[ acc[i].name ] = acc[i]
            }
        }
    
        yield put(GlobalReducer.actions.receiveState(state))
        yield put({type: 'FETCH_DATA_END'})
    } catch (error) {
        console.error('~~ Saga fetchState error ~~>', url, error);
        yield put({type: 'global/FETCHING_STATE', payload: false});
        yield put({type: 'global/CHAIN_API_ERROR', error: error.message});

        if (!(yield cancelled())) {
            yield put({type: 'FETCH_DATA_END'})
        }
    }
}

export function* watchDataRequests() {
    yield takeLatest('REQUEST_DATA', fetchData);
}

export function* fetchData(action) {
}

export function* watchFetchJsonRequests() {
    yield takeEvery('global/FETCH_JSON', fetchJson);
}

/**
    @arg {string} id unique key for result global['fetchJson_' + id]
    @arg {string} url
    @arg {object} body (for JSON.stringify)
*/
function* fetchJson({payload: {id, url, body, successCallback, skipLoading = false}}) {
    try {
        const payload = {
            method: body ? 'POST' : 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        }
        yield put({type: 'global/FETCHING_JSON', payload: true});
        let result = yield skipLoading ? fetch(url, payload) : call(fetch, url, payload)
        result = yield result.json()
        if (successCallback) result = successCallback(result)
        yield put({type: 'global/FETCHING_JSON', payload: false});
        yield put(GlobalReducer.actions.fetchJsonResult({id, result}))
    } catch(error) {
        console.error('fetchJson', error)
        yield put({type: 'global/FETCHING_JSON', payload: false});
        yield put(GlobalReducer.actions.fetchJsonResult({id, error}))
    }
}

export function* watchFetchExchangeRates() {
    yield takeEvery('global/FETCH_EXCHANGE_RATES', fetchExchangeRates);
}

export function* fetchExchangeRates() {
  const fourHours = 1000 * 60 * 60 * 4;

  try {
    const created = 0;
    let pickedCurrency = 'GOLOS';
    if (pickedCurrency.localeCompare(DEBT_TOKEN_SHORT) == 0) {
        storeExchangeValues(1, 1, 1, DEBT_TOKEN_SHORT); // For GBG currency on site #687
        return;
    }
    if (pickedCurrency.localeCompare(LIQUID_TICKER) == 0) { // For Golos currency on site #687
        const feedPrice = yield call([api, api.getCurrentMedianHistoryPriceAsync]);
        let pricePerGolos = feedPrice.base.split(' ')[0] / parseFloat(parseFloat(feedPrice.quote.split(' ')[0] ));
        storeExchangeValues(1, 1, pricePerGolos, pickedCurrency);
        return;
    }
    if (Date.now() - created < fourHours) {
      return;
    }
    // xchange rates are outdated or not exists
    console.log('xChange rates are outdated or not exists, fetching...')

    yield put({type: 'global/FETCHING_JSON', payload: true});

    let result = yield call(fetch, '/api/v1/rates/');
    result = yield result.json();

    if (result.error) {
      console.log('~~ Saga fetchExchangeRates error ~~>', '[0] The result is undefined.');
      storeExchangeValues();
      yield put({type: 'global/FETCHING_XCHANGE', payload: false});
      return;
    }
    if (
      typeof result === 'object' &&
      typeof result.rates === 'object' &&
      typeof result.rates.XAU === 'number' &&
      typeof result.rates[pickedCurrency] === 'number'
    ) {
      // store result into localstorage
      storeExchangeValues(Date.now(), 1/result.rates.XAU, result.rates[pickedCurrency], pickedCurrency);
    }
    else {
      console.log('~~ Saga fetchExchangeRates error ~~>', 'The result is undefined.');
      storeExchangeValues();
    }
    yield put({type: 'global/FETCHING_XCHANGE', payload: false});
  }
  catch(error) {
    // set default values
    storeExchangeValues();
    console.error('~~ Saga fetchExchangeRates error ~~>', error);
    yield put({type: 'global/FETCHING_XCHANGE', payload: false});
  }
}

function storeExchangeValues(created, gold, pair, picked) {
  localStorage.setItem('xchange.created', created || 0);
  localStorage.setItem('xchange.gold', gold || 1);
  localStorage.setItem('xchange.pair', pair || 1);
  localStorage.setItem('xchange.picked', picked || DEBT_TOKEN_SHORT);
}

export function* watchFetchVestingDelegations() {
    yield takeLatest('global/FETCH_VESTING_DELEGATIONS', fetchVestingDelegations)
}

export function* fetchVestingDelegations({ payload: { account, type } }) {
    const r = yield call([ api, api.getVestingDelegationsAsync ], account, '', 100, type)

    const vesting_delegations = {}
    for (let v in r) {
        vesting_delegations[ type === 'delegated' ? r[v].delegatee : r[v].delegator ] = r[v]
    }

    yield put(GlobalReducer.actions.receiveAccountVestingDelegations({ account, type, vesting_delegations }))
}

export function* watchFetchUiaBalances() {
    yield takeLatest('global/FETCH_UIA_BALANCES', fetchUiaBalances)
}

export function* fetchUiaBalances({ payload: { account } }) {
    try {
        let assets = yield call([api, api.getAccountsBalancesAsync], [account])
        assets = assets && assets[0]
        if (assets) {
            yield put(GlobalReducer.actions.receiveUiaBalances({assets}))
        }
    } catch (err) {
        console.error('fetchUiaBalances', err)
    }
}
