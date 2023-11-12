import { Map, Set, List, fromJS, Iterable } from 'immutable';
import createModule from 'redux-modules';
import { emptyContent } from 'app/redux/EmptyState';
import constants from './constants';
import { fromJSGreedy } from 'app/utils/StateFunctions';

const emptyContentMap = Map(emptyContent);

const upsertNftAssets = (state, nft_assets, start_token_id) => {
    if (!start_token_id) {
        state = state.set('nft_assets', fromJS(nft_assets))
    } else {
        state = state.update('nft_assets', data => {
            data = data.merge(nft_assets)
            return data
        })
    }
    return state
}

const upsertPagedItems = (state, key, items, start_item_id, next_from) => {
    if (!start_item_id) {
        state = state.set(key, fromJS({
            data: items,
            next_from
        }))
    } else {
        state = state.update(key, stateItems => {
            stateItems = stateItems.update('data', data => {
                for (const item of items) {
                    data = data.push(fromJS(item))
                }
                return data
            })
            stateItems = stateItems.set('next_from', next_from)
            return stateItems
        })
    }
    return state
}

const upsertNftTokens = (state, nft_tokens, start_token_id, next_from) => {
    return upsertPagedItems(state, 'nft_tokens', nft_tokens, start_token_id, next_from)
}

const upsertNftOrders = (state, nft_orders, start_order_id, next_from) => {
    return upsertPagedItems(state, 'nft_orders', nft_orders, start_order_id, next_from)
}

const upsertOwnNftOrders = (state, own_nft_orders, start_order_id, next_from) => {
    return upsertPagedItems(state, 'own_nft_orders', own_nft_orders, start_order_id, next_from)
}

const upsertNftMarketColls = (state, nft_colls, start_name, next_from) => {
    return upsertPagedItems(state, 'nft_market_collections', nft_colls, start_name, next_from)
}


export default createModule({
    name: 'global',
    initialState: Map({
        status: Map({}),
        assets: Map({}),
        worker_requests: Map({}),
        accounts: Map({}),
        witnesses: Map({})
    }),
    transformations: [
        {
            action: 'SET_COLLAPSED',
            reducer: (state, action) =>
                state.updateIn(['content', action.payload.post], value =>
                    value.merge(Map({ collapsed: action.payload.collapsed }))
                ),
        },
        {
            action: 'FETCHING_STATE',
            reducer: (state, { payload: fetching }) =>
                state.mergeDeep({ fetching }),
        },
        {
            action: 'FETCHING_JSON',
            reducer: (state, { payload: fetchingJson }) =>
                state.mergeDeep({ fetchingJson }),
        },
        {
            action: 'FETCHING_XCHANGE',
            reducer: (state, { payload: fetchingXchange }) =>
                state.mergeDeep({ fetchingXchange }),
        },
        {
            action: 'RECEIVE_STATE',
            reducer: (state, action) => {
                let payload = fromJS(action.payload);
                if (payload.has('content')) {
                    // TODO reserved words used in account names, find correct solution
                    if (!Map.isMap(payload.get('accounts'))) {
                        const accounts = payload.get('accounts');
                        payload = payload.set(
                            'accounts',
                            fromJSGreedy(accounts)
                        );
                    }
                }
                let res = state
                if (res.has('nft_collections'))
                    res = res.delete('nft_collections')
                res = res.mergeDeep(payload)
                if (!payload.has('nft_tokens')) {
                    if (!window.location.pathname.endsWith('/nft-tokens')) {
                        res = res.delete('nft_tokens')
                    }
                }
                return res
            },
        },
        {
            action: 'RECEIVE_ACCOUNT',
            reducer: (state, { payload: { account } }) => {
                account = fromJS(account, (key, value) => {
                    if (key === 'witness_votes') {
                        return value.toSet();
                    } else {
                        return Iterable.isIndexed(value)
                            ? value.toList()
                            : value.toOrderedMap();
                    }
                });
                // Merging accounts: A get_state will provide a very full account but a get_accounts will provide a smaller version
                return state.updateIn(
                    ['accounts', account.get('name')],
                    Map(),
                    a => a.mergeDeep(account)
                );
            },
        },
        {
            action: 'RECEIVE_COMMENT',
            reducer: (state, { payload: op }) => {
                const {
                    author,
                    permlink,
                    parent_author = '',
                    parent_permlink = '',
                    title = '',
                    body,
                } = op;
                const key = author + '/' + permlink;

                let updatedState = state.updateIn(
                    ['content', key],
                    Map(emptyContent),
                    r =>
                        r.merge({
                            author,
                            permlink,
                            parent_author,
                            parent_permlink,
                            title: title.toString('utf-8'),
                            body: body.toString('utf-8'),
                        })
                );

                if (parent_author !== '' && parent_permlink !== '') {
                    const parent_key = parent_author + '/' + parent_permlink;

                    updatedState = updatedState.updateIn(
                        ['content', parent_key, 'replies'],
                        List(),
                        r => r.insert(0, key)
                    );

                    const children = updatedState.getIn(
                        ['content', parent_key, 'replies'],
                        List()
                    ).size;

                    updatedState = updatedState.updateIn(
                        ['content', parent_key, 'children'],
                        () => children
                    );
                }
                return updatedState;
            },
        },
        {
            action: 'RECEIVE_CONTENT',
            reducer: (state, { payload: { content } }) => {
                content = fromJS(content);
                const key =
                    content.get('author') + '/' + content.get('permlink');

                return state.updateIn(['content', key], Map(), c => {
                    c = emptyContentMap.mergeDeep(c);
                    c = c.delete('active_votes');
                    c = c.mergeDeep(content);
                    return c;
                });
            },
        },
        {
            action: 'RECEIVE_WORKER_REQUEST',
            reducer: (state, { payload: { wr } }) => {
                wr = fromJS(wr);
                const post = wr.get('post');
                const url = post.get('author') + '/' + post.get('permlink');
                return state.updateIn(['worker_requests', url], Map(), w => {
                    w = w.delete('votes');
                    w = w.mergeDeep(wr);
                    return w;
                });
            },
        },
        {
            action: 'FETCH_UIA_BALANCES',
            reducer: state => state,
        },
        {
            action: 'RECEIVE_UIA_BALANCES',
            reducer: (state, { payload: { assets } }) => {
                return state.set('assets', fromJS(assets))
            },
        },
        {
            action: 'FETCH_NFT_TOKENS',
            reducer: state => state,
        },
        {
            action: 'RECEIVE_NFT_TOKENS',
            reducer: (state, { payload: { nft_tokens, start_token_id, next_from, nft_assets } }) => {
                let new_state = state
                new_state = upsertNftTokens(new_state, nft_tokens, start_token_id, next_from)
                if (nft_assets) {
                    new_state = upsertNftAssets(new_state, nft_assets, start_token_id)
                }
                return new_state
            },
        },
        {
            action: 'FETCH_NFT_COLLECTION_TOKENS',
            reducer: state => state,
        },
        {
            action: 'RECEIVE_NFT_COLLECTION_TOKENS',
            reducer: (state, { payload: { nft_coll, nft_tokens, start_token_id, next_from, nft_assets } }) => {
                let new_state = state
                if (nft_coll) {
                    new_state = new_state.set('nft_collection', fromJS(nft_coll))
                    new_state = new_state.set('nft_collection_loaded', true)
                }
                new_state = upsertNftTokens(new_state, nft_tokens, start_token_id, next_from)
                if (nft_assets) {
                    new_state = upsertNftAssets(new_state, nft_assets, start_token_id)
                }
                return new_state
            },
        },
        {
            action: 'FETCH_NFT_MARKET',
            reducer: state => state,
        },
        {
            action: 'RECEIVE_NFT_MARKET',
            reducer: (state, { payload: { nft_orders, own_nft_orders, start_order_id, next_from, nft_assets } }) => {
                let new_state = state
                new_state = upsertNftOrders(new_state, nft_orders, start_order_id, next_from)
                new_state = upsertOwnNftOrders(new_state, own_nft_orders)
                if (nft_assets) {
                    new_state = upsertNftAssets(new_state, nft_assets, start_order_id)
                }
                return new_state
            },
        },
        {
            action: 'FETCH_NFT_MARKET_COLLECTIONS',
            reducer: state => state,
        },
        {
            action: 'RECEIVE_NFT_MARKET_COLLECTIONS',
            reducer: (state, { payload: { nft_colls, start_name, next_from, } }) => {
                let new_state = state
                new_state = upsertNftMarketColls(new_state, nft_colls, start_name, next_from)
                return new_state
            },
        },
        {
            action: 'LINK_REPLY',
            reducer: (state, { payload: op }) => {
                const {
                    author,
                    permlink,
                    parent_author = '',
                    parent_permlink = '',
                } = op;

                if (parent_author === '' || parent_permlink === '') {
                    return state;
                }

                const key = author + '/' + permlink;
                const parent_key = parent_author + '/' + parent_permlink;
                // Add key if not exist
                let updatedState = state.updateIn(
                    ['content', parent_key, 'replies'],
                    List(),
                    l => (l.findIndex(i => i === key) === -1 ? l.push(key) : l)
                );

                const children = updatedState.getIn(
                    ['content', parent_key, 'replies'],
                    List()
                ).size;

                updatedState = updatedState.updateIn(
                    ['content', parent_key, 'children'],
                    () => children
                );

                return updatedState;
            },
        },
        {
            action: 'UPDATE_ACCOUNT_WITNESS_VOTE',
            reducer: (state, { payload: { account, witness, approve } }) =>
                state.updateIn(
                    ['accounts', account, 'witness_votes'],
                    Set(),
                    votes =>
                        approve
                            ? Set(votes).add(witness)
                            : Set(votes).remove(witness)
                ),
        },
        {
            action: 'UPDATE_ACCOUNT_WITNESS_PROXY',
            reducer: (state, { payload: { account, proxy } }) =>
                state.setIn(['accounts', account, 'proxy'], proxy),
        },
        {
            action: 'DELETE_CONTENT',
            reducer: (state, { payload: { author, permlink } }) => {
                const key = author + '/' + permlink;
                const content = state.getIn(['content', key]);
                const parentAuthor = content.get('parent_author') || '';
                const parentPermlink = content.get('parent_permlink') || '';
                let updatedState = state.deleteIn(['content', key]);

                if (parentAuthor !== '' && parentPermlink !== '') {
                    const parent_key = parentAuthor + '/' + parentPermlink;

                    updatedState = updatedState.updateIn(
                        ['content', parent_key, 'replies'],
                        List(),
                        r => r.filter(i => i !== key)
                    );
                }

                return updatedState;
            },
        },
        {
            action: 'VOTED',
            reducer: (
                state,
                { payload: { username, author, permlink, weight } }
            ) =>
                state.updateIn(
                    ['content', author + '/' + permlink, 'active_votes'],
                    List(),
                    activeVotes =>
                        activeVotes.withMutations(activeVotes => {
                            const vote = Map({
                                voter: username,
                                percent: weight,
                            });
                            const idx = activeVotes.findIndex(
                                v => v.get('voter') === username
                            );

                            if (idx === -1) {
                                activeVotes.push(vote);
                            } else {
                                activeVotes.set(idx, vote);
                            }
                        })
                ),
        },
        {
            action: 'DONATED',
            reducer: (
                state,
                { payload: { username, author, permlink, amount } }
            ) => {
                let new_state = state;
                new_state = new_state.setIn(
                    ['content', author + '/' + permlink, 'confetti_active'],
                    true);
                const donateListKey = amount.endsWith('GOLOS') ? 'donate_list' : 'donate_uia_list';
                new_state = new_state.updateIn(
                    ['content', author + '/' + permlink, donateListKey],
                    List(),
                    donateList =>
                        donateList.withMutations(donateList => {
                            const idx = donateList.findIndex(
                                v => v.get('from') === username && v.get('amount').split(' ')[1] === amount.split(' ')[1]
                            );

                            if (idx === -1) {
                                const donate = Map({
                                    from: username,
                                    amount,
                                });
                                donateList.push(donate);
                            } else {
                                const oldAmount = parseInt(donateList.get(idx).toJS().amount.split(".")[0]);
                                const newAmount = parseInt(amount.split(".")[0]);
                                const donate = Map({
                                    from: username,
                                    amount: (oldAmount + newAmount).toString() + ".000 " + amount.split(" ")[1],
                                });
                                donateList.set(idx, donate);
                            }
                        })
                );
                return new_state;
            },
        },
        {
            action: 'FETCHING_DATA',
            reducer: (state, { payload: { order, category } }) =>
                state.updateIn(['status', category || '', order], () => ({
                    fetching: true,
                })),
        },
        {
            action: 'RECEIVE_DATA',
            reducer: (state, { payload }) => {
                const {
                    data,
                    order,
                    category,
                    permlink: startPermLink,
                    accountname,
                    has_from_search,
                    next_from,
                } = payload;
                let newState = state;

                let dataPath;

                if (
                    order === 'by_author' ||
                    order === 'by_feed' ||
                    order === 'by_comments' ||
                    order === 'by_replies'
                ) {
                    dataPath = ['accounts', accountname, category];
                } else {
                    dataPath = ['discussion_idx', category || '', order];
                }

                newState = newState.updateIn(dataPath, List(), posts => {
                    const links = [];
                    data.map(v => {
                      let link = `${v.author}/${v.permlink}`
                      if (!links.includes(link)) links.push(link)
                    })

                    if (startPermLink) {
                        return posts.withMutations(posts => {
                            for (let id of links.filter(id => !posts.includes(id))) {
                                posts.push(id);
                            }
                        });
                    } else {
                        return fromJS(links);
                    }
                });

                newState = newState.updateIn(
                    ['status', category || '', order],
                    () => {
                        if (data.length < constants.FETCH_DATA_BATCH_SIZE) {
                            return { fetching: false, lastFetch: Date.now() };
                        } else {
                            return { fetching: false };
                        }
                    }
                );

                newState = newState.set('has_from_search', has_from_search)
                    .set('next_from', next_from)

                return newState;
            },
        },
        {
            action: 'RECEIVE_RECENT_POSTS',
            reducer: (state, { payload: { data } }) => {
                let newState = state.updateIn(
                    ['discussion_idx', '', 'created'],
                    List(),
                    posts =>
                        posts.withMutations(posts => {
                            for (let { author, permlink } of data) {
                                const entry = `${author}/${permlink}`;

                                if (!posts.includes(entry)) {
                                    posts.unshift(entry);
                                }
                            }
                        })
                );

                return newState;
            },
        },
        {
            action: 'REQUEST_META',
            reducer: (state, { payload: { id, link } }) =>
                state.setIn(['metaLinkData', id], Map({ link })),
        },
        {
            action: 'RECEIVE_META',
            reducer: (state, { payload: { id, meta } }) =>
                state.updateIn(['metaLinkData', id], data => data.merge(meta)),
        },
        {
            action: 'SET',
            reducer: (state, { payload: { key, value } }) => {
                return state.setIn(Array.isArray(key) ? key : [key], fromJS(value));
            },
        },
        {
            action: 'REMOVE',
            reducer: (state, { payload: { key } }) => {
                return state.removeIn(Array.isArray(key) ? key : [key]);
            },
        },
        {
            action: 'UPDATE',
            reducer: (state, { payload: { key, notSet = Map(), updater } }) => {
                // key = Array.isArray(key) ? key : [key] // TODO enable and test
                return state.updateIn(key, notSet, updater)
            }
        },
        {
            action: 'SET_META_DATA',
            reducer: (state, { payload: { id, meta } }) =>
                state.setIn(['metaLinkData', id], fromJS(meta)),
        },
        {
            action: 'CLEAR_META',
            reducer: (state, { payload: { id } }) =>
                state.deleteIn(['metaLinkData', id]),
        },
        {
            action: 'CLEAR_META_ELEMENT',
            reducer: (state, { payload: { formId, element } }) =>
                state.updateIn(['metaLinkData', formId], data =>
                    data.remove(element)
                ),
        },
        {
            action: 'FETCH_JSON',
            reducer: state => state,
        },
        {
            action: 'FETCH_EXCHANGE_RATES',
            reducer: state => state,
        },
        {
            action: 'FETCH_JSON_RESULT',
            reducer: (state, { payload: { id, result, error } }) =>
                state.set(id, fromJS({ result, error })),
        },
        {
            action: 'SHOW_DIALOG',
            reducer: (state, { payload: { name, params = {} } }) =>
                state.update('active_dialogs', Map(), d =>
                    d.set(name, fromJS({ params }))
                ),
        },
        {
            action: 'HIDE_DIALOG',
            reducer: (state, { payload: { name } }) =>
                state.update('active_dialogs', d => d.delete(name)),
        },
        {
            action: 'RECEIVE_ACCOUNT_VESTING_DELEGATIONS',
            reducer: (
                state,
                { payload: { account, type, vesting_delegations } }
            ) =>
                state.setIn(
                    ['accounts', account, `${type}_vesting`],
                    fromJS(vesting_delegations)
                ),
        },
    ],
});
