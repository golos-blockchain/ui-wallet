import { CATEGORIES } from 'app/client_config';
import { contentPrefs as prefs } from 'app/utils/Allowance'
import { getPinnedPosts, getMutedInNew } from 'app/utils/NormalizeProfile';
import { reveseTag, prepareTrendingTags, getFilterTags } from 'app/utils/tags';
import { stateSetVersion } from 'app/utils/SearchClient'

const DEFAULT_VOTE_LIMIT = 10000

const isHardfork = (v) => v.split('.')[1] === '18'

export default async function getState(api, url, offchain = {}) {
    const curUser = offchain.account

    if (!url || typeof url !== 'string' || !url.length || url === '/') url = 'trending'
    const urlParts = url.split('?')
    url = urlParts[0]
    if (url[0] === '/') url = url.substr(1)
    
    const parts = url.split('/')
    // decode tag for cyrillic symbols
    const tag = typeof parts[1] !== 'undefined' ? decodeURIComponent(parts[1]) : ''

    const state = {}
    state.current_route = `/${url}`
    state.props = await api.getDynamicGlobalProperties()
    state.assets = {}
    state.worker_requests = {}
    state.accounts = {}
    state.witnesses = {}
    state.feed_price = await api.getCurrentMedianHistoryPrice()

    let accounts = new Set()

    if (parts[0][0] === '@') {
        const uname = parts[0].substr(1)
        const [ account ] = await api.getAccounts([uname])
        state.accounts[uname] = account
        
        if (account) {
            switch (parts[1]) {
                case 'create-asset':
                case 'assets':
                    state.assets = (await api.getAccountsBalances([uname]))[0]
                    const my_assets = await api.getAssets()
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

                    state.cprops = await api.getChainProperties();
                break

                case 'invites':
                    state.cprops = await api.getChainProperties();
                break

                case 'witness':
                    state.witnesses[uname] = await api.getWitnessByAccount(uname)
                break


                case 'filled-orders':
                    const fohistory = await api.getAccountHistory(uname, -1, 1000, [], ['fill_order']);
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
                    const history = await api.getAccountHistory(uname, -1, 1000, [], ['donate', 'transfer', 'author_reward', 'curation_reward', 'transfer_to_tip', 'transfer_from_tip', 'transfer_to_vesting', 'withdraw_vesting', 'asset_issue', 'invite', 'transfer_to_savings', 'transfer_from_savings', 'convert_sbd_debt', 'convert', 'fill_convert_request', 'interest', 'worker_reward', 'account_freeze', 'unwanted_cost', 'unlimit_cost'])
                    account.transfer_history = []
                    account.other_history = []

                    state.cprops = await api.getChainProperties();
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
        let witnessIds = [];
        const witnesses = await api.getWitnessesByVote('', 100)
        witnesses.forEach(witness => {
            state.witnesses[witness.owner] = witness;
            accounts.add(witness.owner);
            witnessIds.push(witness.id);
        });

        const voteMap = await api.getWitnessVotes(witnessIds);
        witnesses.forEach(witness => {
            const voteList = voteMap[witness.id];
            state.witnesses[witness.owner].vote_list = voteList || [];
        });
    }  else if (parts[0] === 'nodes') {
        const witnesses = await api.getWitnessesByVote('', 100)
        witnesses.forEach( witness => {
            state.witnesses[witness.owner] = witness;
            accounts.add(witness.owner);
        })
  
  
    }  else if (parts[0] === 'workers') {
        accounts.add('workers');
        state.cprops = await api.getChainProperties();
        if (parts.length === 4) {
            const author = parts[2].substr(1);
            const permlink = parts[3];
            const url = `${author}/${permlink}`;
            const query = {
              limit: 1,
              start_author: author,
              start_permlink: permlink
            };
            const [ wr ] = await api.getWorkerRequests(query, 'by_created', true);
            state.worker_requests[url] = wr;

            const votes = await api.getWorkerRequestVotes(author, permlink, '', 50);
            state.worker_requests[url].votes = votes;

            if (curUser) {
                const [ myVote ] = await api.getWorkerRequestVotes(author, permlink, curUser, 1);
                state.worker_requests[url].myVote = (myVote && myVote.voter == curUser) ? myVote : null;
            }
        }
    }

    if (accounts.size > 0) {
        const acc = await api.getAccounts(Array.from(accounts))
        acc.forEach(account =>  state.accounts[ account.name ] = account)
    }

    return Promise.resolve(state)
}
