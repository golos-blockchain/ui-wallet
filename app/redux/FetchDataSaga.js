import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';
import cookie from "react-cookie";
import {config, api} from 'golos-lib-js';
import { Asset } from 'golos-lib-js/lib/utils'

import { getPinnedPosts, getMutedInNew } from 'app/utils/NormalizeProfile';
import { getBlockings, listBlockings } from 'app/redux/BlockingSaga'
import { contentPrefs as prefs } from 'app/utils/Allowance'
import {getContent} from 'app/redux/SagaShared';
import GlobalReducer from './GlobalReducer';
import constants from './constants';
import { reveseTag, getFilterTags } from 'app/utils/tags';
import { CATEGORIES, SELECT_TAGS_KEY, DEBT_TOKEN_SHORT, LIQUID_TICKER } from 'app/client_config';
import { getAllPairs } from 'app/utils/market/utils'
import { parseNFTImage, NFTImageStub } from 'app/utils/NFTUtils'

function* fillNftCollectionImages(nft_collections) {
    const noImgColls = {}
    for (let i = 0; i < nft_collections.length; ++i) {
        const nco = nft_collections[i]

        nco.image = parseNFTImage(nco.json_metadata, false)
        if (!nco.image) {
            noImgColls[nco.name] = i
        }
    }

    const noImgKeys = Object.keys(noImgColls)

    if (!noImgKeys.length) return

    const tokens = (yield call([api, api.getNftTokensAsync], {
        select_collections: noImgKeys,
        collection_limit: 1,
        limit: 100,
        collections: false,
        orders: false,
    }))

    for (const token of tokens) {
        const idx = noImgColls[token.name]
        const nco = nft_collections[idx]
        nco.image = parseNFTImage(token.json_metadata)
    }
}

function* loadNftAssets(nft_assets, syms) {
    if (syms.size) {
        const assets = yield call([api, api.getAssets], '', [...syms])
        for (const a of assets) {
            const supply = Asset(a.supply)
            nft_assets[supply.symbol] = a
        }
    }
}

export function* fetchDataWatches () {
    yield fork(watchLocationChange);
    yield fork(watchDataRequests);
    yield fork(watchFetchJsonRequests);
    yield fork(watchFetchState);
    yield fork(watchGetContent);
    yield fork(watchFetchExchangeRates);
    yield fork(watchFetchVestingDelegations);
    yield fork(watchFetchUiaBalances);
    yield fork(watchFetchNftTokens)
    yield fork(watchFetchNftCollectionTokens)
    yield fork(watchFetchNftMarket)
    yield fork(watchFetchNftMarketCollections)
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
        state.witnesses = {}
        state.props = yield call([api, api.getDynamicGlobalProperties])
        state.feed_price = yield call([api, api.getCurrentMedianHistoryPrice])

        state.chain_failure = state.props.chain_status === false

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
                                    tip_balance: '0.' + '0'.repeat(precision) + ' ' + sym,
                                    market_balance: '0.' + '0'.repeat(precision) + ' ' + sym
                                }
                            }

                            state.assets[sym] = {...state.assets[sym], ...ma, precision}

                            if (ma.creator == uname) {
                                state.assets[sym].my = true
                                state.assets[sym].myCreated = true
                            }
                        })

                        state.cprops = yield call([api, api.getChainPropertiesAsync])
                    break

                    case 'nft-collections':
                        state.nft_collections = (yield call([api, api.getNftCollectionsAsync], {
                            creator: uname,
                            limit: 100,
                            sort: 'by_created'
                        }))

                        try {
                            yield fillNftCollectionImages(state.nft_collections)

                            const syms = new Set()

                            for (const nco of state.nft_collections) {
                                nco.image = nco.image || NFTImageStub()

                                const price = Asset(nco.last_buy_price)
                                syms.add(price.symbol)
                            }

                            state.nft_assets = {}
                            yield loadNftAssets(state.nft_assets, syms)
                        } catch (err) {
                            console.error(err)
                        }

                        state.cprops = yield call([api, api.getChainPropertiesAsync])
                    break

                    case 'nft-tokens':
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
                    case 'witness':
                        state.witnesses[uname] = yield call([api, api.getWitnessByAccountAsync], uname)
                    break
                    case 'nft-history':
                        const nftHistory = yield call([api, api.getAccountHistoryAsync], uname, -1, 1000, {select_ops: ['nft_token', 'nft_transfer', 'nft_token_sold']})
                        account.nft_history = []

                        state.cprops = yield call([api, api.getChainPropertiesAsync])

                        const nft_token_ids = new Set()

                        nftHistory.forEach(operation => {
                            switch (operation[1].op[0]) {
                                case 'nft_token':
                                case 'nft_transfer':
                                case 'nft_token_sold':
                                    const { token_id } = operation[1].op[1]
                                    if (token_id !== 0) nft_token_ids.add(token_id)
                                    state.accounts[uname].nft_history.push(operation)
                                break

                                default:
                                break
                            }
                        })

                        try {
                            if (nft_token_ids.size) {
                                state.nft_token_map = {}
                                const nft_tokens = (yield call([api, api.getNftTokensAsync], {
                                    select_token_ids: [...nft_token_ids],
                                    state: 'any'
                                }))
                                for (const nft of nft_tokens) {
                                    state.nft_token_map[nft.token_id] = nft
                                }
                            }
                        } catch (err) {
                            console.error(err)
                        }
                    break
                    case 'transfers':
                    default:
                        const history = yield call([api, api.getAccountHistoryAsync], uname, -1, 1000, {select_ops: ['donate', 'transfer', 'author_reward', 'curation_reward', 'transfer_to_tip', 'transfer_from_tip', 'transfer_to_vesting', 'withdraw_vesting', 'asset_issue', 'invite', 'transfer_to_savings', 'transfer_from_savings', 'convert_sbd_debt', 'convert', 'fill_convert_request', 'interest', 'worker_reward', 'account_freeze', 'unwanted_cost', 'unlimit_cost', 'subscription_payment'/*, 'subscription_prepaid_return'*/, ]})
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
                                case 'subscription_payment':
                                //case 'subscription_prepaid_return':
                                    state.accounts[uname].transfer_history.push(operation)
                                break

                                default:
                                    state.accounts[uname].other_history.push(operation)
                            }
                        })
                    break
                }
            }

        } else if (parts[0] === 'nft-tokens') {
            if (parts[1]) {
                state.nft_token = (yield call([api, api.getNftTokensAsync], {
                    select_token_ids: [parts[1]],
                    state: 'any'
                }))
                state.nft_token = state.nft_token[0]
                state.nft_token_loaded = true

                try {
                    const syms = new Set()

                    if (state.nft_token) {
                        state.nft_token.image = parseNFTImage(state.nft_token.json_metadata)

                        if (state.nft_token.order) {
                            const price = Asset(state.nft_token.order.price)
                            syms.add(price.symbol)
                        }
                    }

                    state.nft_assets = {}
                    yield loadNftAssets(state.nft_assets, syms)
                } catch (err) {
                    console.error(err)
                }
            }
        } else if (parts[0] === 'witnesses' || parts[0] === '~witnesses') {
            state.witnesses = {};

            let witnessIds = [];
            const witnesses = yield call([api, api.getWitnessesByVoteAsync], '', 100);
            witnesses.forEach(witness => {
                state.witnesses[witness.owner] = witness;
                witnessIds.push(witness.id);
                accounts.add(witness.owner)
            });

            const voteMap = yield call([api, api.getWitnessVotesAsync], witnessIds, 21, 0, '1.000 GOLOS');
            witnesses.forEach(witness => {
                let voteList = voteMap[witness.id];
                state.witnesses[witness.owner].vote_list = voteList || [];
            });
        } else if (parts[0] === 'nodes') {
            const witnesses = yield call([api, api.getWitnessesByVoteAsync], '', 100)
            witnesses.forEach(witness => {
                state.witnesses[witness.owner] = witness
                accounts.add(witness.owner)
            })
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
            const acc = yield call([api, api.getAccountsAsync], Array.from(accounts))
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

export function* watchFetchNftTokens() {
    yield takeLatest('global/FETCH_NFT_TOKENS', fetchNftTokens)
}

export function* fetchNftTokens({ payload: { account, start_token_id, sort, reverse_sort } }) {
    try {
        const limit = 20

        const nft_tokens = yield call([api, api.getNftTokensAsync], {
            owner: account,
            collections: false,
            start_token_id,
            limit: limit + 1,
            sort: sort || 'by_last_update',
            selling_sorting: sort == 'by_last_price' ? 'sort_up_by_price': 'nothing',
            reverse_sort: !!reverse_sort
        })

        let next_from
        if (nft_tokens.length > limit) {
            next_from = nft_tokens.pop().token_id
        }

        let nft_assets

        try {
            const syms = new Set()

            for (const no of nft_tokens) {
                no.image = parseNFTImage(no.json_metadata)

                if (no.order) {
                    const price = Asset(no.order.price)
                    syms.add(price.symbol)
                }
            }

            nft_assets = {}
            yield loadNftAssets(nft_assets, syms)
        } catch (err) {
            console.error(err)
        }

        yield put(GlobalReducer.actions.receiveNftTokens({nft_tokens, start_token_id, next_from, nft_assets}))
    } catch (err) {
        console.error('fetchNftTokens', err)
    }
}

export function* watchFetchNftCollectionTokens() {
    yield takeLatest('global/FETCH_NFT_COLLECTION_TOKENS', fetchNftCollectionTokens)
}

export function* fetchNftCollectionTokens({ payload: { collectionName, start_token_id, sort, reverse_sort } }) {
    try {
        let nft_coll

        if (!start_token_id) {
            nft_coll = yield call([api, api.getNftCollectionsAsync], {
                select_names: [collectionName],
                limit: 1
            })
            nft_coll = nft_coll[0]
        }

        const limit = 20

        const nft_tokens = yield call([api, api.getNftTokensAsync], {
            select_collections: [collectionName],
            start_token_id,
            collections: false,
            sort: sort || 'by_last_update',
            reverse_sort: !!reverse_sort,
            selling_sorting: 'sort_up_by_price',
            limit: limit + 1
        })

        let next_from
        if (nft_tokens.length > limit) {
            next_from = nft_tokens.pop().token_id
        }

        let nft_assets

        try {
            const syms = new Set()

            for (const no of nft_tokens) {
                no.image = parseNFTImage(no.json_metadata)

                if (no.order) {
                    const price = Asset(no.order.price)
                    syms.add(price.symbol)
                }

                const price = Asset(no.last_buy_price)
                syms.add(price.symbol)
            }

            nft_assets = {}
            yield loadNftAssets(nft_assets, syms)
        } catch (err) {
            console.error(err)
        }

        yield put(GlobalReducer.actions.receiveNftCollectionTokens({nft_coll, nft_tokens, start_token_id, next_from, nft_assets}))
    } catch (err) {
        console.error('fetchNftCollectionTokens', err)
    }
}

export function* watchFetchNftMarket() {
    yield takeLatest('global/FETCH_NFT_MARKET', fetchNftMarket)
}

export function* fetchNftMarket({ payload: { account, collectionName, start_order_id, sort, reverse_sort } }) {
    try {
        const limit = 20

        const nft_orders = yield call([api, api.getNftOrdersAsync], {
            filter_owners: [account],
            select_collections: collectionName ? [collectionName] : undefined,
            start_order_id,
            type: 'selling',
            sort: sort || 'by_price',
            reverse_sort: !!reverse_sort,
            limit: limit + 1
        })

        let next_from
        if (nft_orders.length > limit) {
            next_from = nft_orders.pop().order_id
        }

        const own_nft_orders = account ? yield call([api, api.getNftOrdersAsync], {
            owner: account,
            select_collections: collectionName ? [collectionName] : undefined,
            start_order_id,
            type: 'selling',
            sort: sort || 'by_price',
            reverse_sort: !!reverse_sort,
            limit: 100
        }) : []

        let nft_assets

        try {
            const syms = new Set()

            for (const no of nft_orders) {
                no.token.image = parseNFTImage(no.token.json_metadata)

                const price = Asset(no.price)
                syms.add(price.symbol)
            }

            for (const no of own_nft_orders) {
                no.token.image = parseNFTImage(no.token.json_metadata)

                const price = Asset(no.price)
                syms.add(price.symbol)
            }

            nft_assets = {}
            yield loadNftAssets(nft_assets, syms)
        } catch (err) {
            console.error(err)
        }

        yield put(GlobalReducer.actions.receiveNftMarket({nft_orders, own_nft_orders, start_order_id, next_from, nft_assets}))
    } catch (err) {
        console.error('fetchNftMarket', err)
    }
}

export function* watchFetchNftMarketCollections() {
    yield takeLatest('global/FETCH_NFT_MARKET_COLLECTIONS', fetchNftMarketCollections)
}

export function* fetchNftMarketCollections({ payload: { start_name } }) {
    try {
        const limit = 99

        const nft_colls = yield call([api, api.getNftCollectionsAsync], {
            start_name,
            limit: limit + 1,
            sort: 'by_token_count'
        })

        let next_from
        if (nft_colls.length > limit) {
            next_from = nft_colls.pop().name
        }

        try {
            yield fillNftCollectionImages(nft_colls)
        } catch (err) {
            console.error(err)
        }

        const filtered = nft_colls.filter(coll => coll.sell_order_count !== 0)

        yield put(GlobalReducer.actions.receiveNftMarketCollections({
            nft_colls: filtered, start_name, next_from
        }))
    } catch (err) {
        console.error('fetchNftMarketCollections', err)
    }
}
