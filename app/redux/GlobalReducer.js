import { createSlice } from '@reduxjs/toolkit';
import { emptyContent } from 'app/redux/EmptyState';
import constants from './constants';
import { deepMerge, getIn, removeIn, setIn, updateIn } from 'app/utils/PlainState';

const emptyContentMap = emptyContent;

const ensureObject = (state, key) => {
    if (!state[key]) {
        state[key] = {};
    }
    return state[key];
};

const ensureArray = (state, key) => {
    if (!state[key]) {
        state[key] = [];
    }
    return state[key];
};

const upsertNftAssets = (state, nftAssets, startTokenId) => {
    if (!startTokenId) {
        state.nft_assets = nftAssets;
    } else {
        state.nft_assets = {
            ...(state.nft_assets || {}),
            ...nftAssets,
        };
    }
};

const upsertPagedItems = (state, key, items, startItemId, nextFrom) => {
    if (!startItemId) {
        state[key] = {
            data: items,
            next_from: nextFrom,
        };
    } else {
        if (!state[key]) {
            state[key] = { data: [], next_from: nextFrom };
        }
        if (!state[key].data) {
            state[key].data = [];
        }
        state[key].data.push(...items);
        state[key].next_from = nextFrom;
    }
};

const upsertNftTokens = (state, nftTokens, startTokenId, nextFrom) =>
    upsertPagedItems(state, 'nft_tokens', nftTokens, startTokenId, nextFrom);

const upsertOwnNftTokens = (state, ownNftTokens, startTokenId, nextFrom) =>
    upsertPagedItems(state, 'own_nft_tokens', ownNftTokens, startTokenId, nextFrom);

const upsertNftOrders = (state, nftOrders, startOrderId, nextFrom) =>
    upsertPagedItems(state, 'nft_orders', nftOrders, startOrderId, nextFrom);

const upsertOwnNftOrders = (state, ownNftOrders, startOrderId, nextFrom) =>
    upsertPagedItems(state, 'own_nft_orders', ownNftOrders, startOrderId, nextFrom);

const upsertNftMarketColls = (state, nftColls, startName, nextFrom) =>
    upsertPagedItems(
        state,
        'nft_market_collections',
        nftColls,
        startName,
        nextFrom
    );

const upsertNftOffers = (state, nftOffers, startOrderId, nextFrom) =>
    upsertPagedItems(state, 'my_nft_offers', nftOffers, startOrderId, nextFrom);

const upsertNftBets = (state, nftBets, startBetId, nextFrom) =>
    upsertPagedItems(state, 'my_nft_bets', nftBets, startBetId, nextFrom);

const globalSlice = createSlice({
    name: 'global',
    initialState: {
        status: {},
        assets: {},
        worker_requests: {},
        accounts: {},
        witnesses: {},
    },
    reducers: {
        setCollapsed(state, action) {
            const post = action.payload.post;
            if (!state.content) state.content = {};
            if (!state.content[post]) state.content[post] = {};
            state.content[post].collapsed = action.payload.collapsed;
        },
        fetchingState(state, { payload: fetching }) {
            state.fetching = fetching;
        },
        fetchingJson(state, { payload: fetchingJson }) {
            state.fetchingJson = fetchingJson;
        },
        fetchingXchange(state, { payload: fetchingXchange }) {
            state.fetchingXchange = fetchingXchange;
        },
        receiveState(state, action) {
            const payload = action.payload || {};
            const res = deepMerge(state, payload);

            delete res.nft_collections;
            if (res.nft_token) {
                delete res.nft_token.my_offer;
                delete res.nft_token.my_bet;
            }
            if (
                !payload.nft_tokens &&
                typeof window !== 'undefined' &&
                !window.location.pathname.endsWith('/nft-tokens')
            ) {
                delete res.nft_tokens;
            }

            return res;
        },
        receiveAccount(state, { payload: { account } }) {
            if (!state.accounts) state.accounts = {};
            state.accounts[account.name] = deepMerge(
                state.accounts[account.name] || {},
                account
            );
        },
        receiveComment(state, { payload: op }) {
            const {
                author,
                permlink,
                parent_author = '',
                parent_permlink = '',
                title = '',
                body,
            } = op;
            const key = author + '/' + permlink;

            if (!state.content) state.content = {};
            state.content[key] = {
                ...(state.content[key] || {}),
                author,
                permlink,
                parent_author,
                parent_permlink,
                title: title.toString('utf-8'),
                body: body.toString('utf-8'),
            };

            if (parent_author !== '' && parent_permlink !== '') {
                const parentKey = parent_author + '/' + parent_permlink;
                if (!state.content[parentKey]) state.content[parentKey] = {};
                const replies = ensureArray(state.content[parentKey], 'replies');
                replies.unshift(key);
                state.content[parentKey].children = replies.length;
            }
        },
        receiveContent(state, { payload: { content } }) {
            const key = content.author + '/' + content.permlink;
            if (!state.content) state.content = {};
            const previous = deepMerge(emptyContentMap, state.content[key] || {});
            delete previous.active_votes;
            state.content[key] = deepMerge(previous, content);
        },
        receiveWorkerRequest(state, { payload: { wr } }) {
            const post = wr.post;
            const url = post.author + '/' + post.permlink;
            if (!state.worker_requests) state.worker_requests = {};
            const previous = { ...(state.worker_requests[url] || {}) };
            delete previous.votes;
            state.worker_requests[url] = deepMerge(previous, wr);
        },
        fetchUiaBalances() {},
        receiveUiaBalances(state, { payload: { assets } }) {
            state.assets = assets;
        },
        fetchNftTokens() {},
        receiveNftTokens(
            state,
            { payload: { nft_tokens, start_token_id, next_from, nft_assets } }
        ) {
            upsertNftTokens(state, nft_tokens, start_token_id, next_from);
            if (nft_assets) {
                upsertNftAssets(state, nft_assets, start_token_id);
            }
        },
        fetchNftCollectionTokens() {},
        receiveNftCollectionTokens(
            state,
            {
                payload: {
                    nft_coll,
                    nft_tokens,
                    start_token_id,
                    next_from,
                    nft_assets,
                },
            }
        ) {
            if (nft_coll) {
                state.nft_collection = nft_coll;
                state.nft_collection_loaded = true;
            }
            upsertNftTokens(state, nft_tokens, start_token_id, next_from);
            if (nft_assets) {
                upsertNftAssets(state, nft_assets, start_token_id);
            }
        },
        fetchNftMarket() {},
        receiveNftMarket(
            state,
            {
                payload: {
                    nft_orders,
                    own_nft_orders,
                    nft_tokens,
                    own_nft_tokens,
                    start_order_id,
                    next_from,
                    nft_assets,
                },
            }
        ) {
            upsertNftOrders(state, nft_orders, start_order_id, next_from);
            upsertOwnNftOrders(state, own_nft_orders);
            upsertNftTokens(state, nft_tokens, 0, 0);
            upsertOwnNftTokens(state, own_nft_tokens);
            if (nft_assets) {
                upsertNftAssets(state, nft_assets, start_order_id);
            }
        },
        fetchNftMarketCollections() {},
        receiveNftMarketCollections(
            state,
            { payload: { nft_colls, start_name, next_from } }
        ) {
            upsertNftMarketColls(state, nft_colls, start_name, next_from);
        },
        fetchNftOrders() {},
        receiveNftOrders(state, { payload: { nft_offers, nft_bets, nft_assets } }) {
            upsertNftOffers(state, nft_offers, 0, 0);
            upsertNftBets(state, nft_bets, 0, 0);
            if (nft_assets) {
                upsertNftAssets(state, nft_assets, 0);
            }
        },
        linkReply(state, { payload: op }) {
            const {
                author,
                permlink,
                parent_author = '',
                parent_permlink = '',
            } = op;

            if (parent_author === '' || parent_permlink === '') {
                return;
            }

            const key = author + '/' + permlink;
            const parentKey = parent_author + '/' + parent_permlink;
            if (!state.content) state.content = {};
            if (!state.content[parentKey]) state.content[parentKey] = {};
            const replies = ensureArray(state.content[parentKey], 'replies');
            if (!replies.includes(key)) {
                replies.push(key);
            }
            state.content[parentKey].children = replies.length;
        },
        updateAccountWitnessVote(state, { payload: { account, witness, approve } }) {
            const accountData = getIn(state, ['accounts', account]);
            if (!accountData) return;
            if (!accountData.witness_votes) accountData.witness_votes = [];
            const votes = new Set(accountData.witness_votes);
            if (approve) {
                votes.add(witness);
            } else {
                votes.delete(witness);
            }
            accountData.witness_votes = Array.from(votes);
        },
        updateAccountWitnessProxy(state, { payload: { account, proxy } }) {
            setIn(state, ['accounts', account, 'proxy'], proxy);
        },
        deleteContent(state, { payload: { author, permlink } }) {
            const key = author + '/' + permlink;
            const content = getIn(state, ['content', key]);
            if (!content) return;
            const parentAuthor = content.parent_author || '';
            const parentPermlink = content.parent_permlink || '';
            removeIn(state, ['content', key]);

            if (parentAuthor !== '' && parentPermlink !== '') {
                const parentKey = parentAuthor + '/' + parentPermlink;
                const replies = getIn(state, ['content', parentKey, 'replies'], []);
                setIn(
                    state,
                    ['content', parentKey, 'replies'],
                    replies.filter(item => item !== key)
                );
            }
        },
        voted(state, { payload: { username, author, permlink, weight } }) {
            const path = ['content', author + '/' + permlink, 'active_votes'];
            const activeVotes = getIn(state, path, []);
            const vote = {
                voter: username,
                percent: weight,
            };
            const idx = activeVotes.findIndex(v => v.voter === username);

            if (idx === -1) {
                activeVotes.push(vote);
            } else {
                activeVotes[idx] = vote;
            }
            setIn(state, path, activeVotes);
        },
        donated(state, { payload: { username, author, permlink, amount } }) {
            setIn(state, ['content', author + '/' + permlink, 'confetti_active'], true);
            const donateListKey = amount.endsWith('GOLOS')
                ? 'donate_list'
                : 'donate_uia_list';
            const path = ['content', author + '/' + permlink, donateListKey];
            const donateList = getIn(state, path, []);
            const idx = donateList.findIndex(
                v =>
                    v.from === username &&
                    v.amount.split(' ')[1] === amount.split(' ')[1]
            );

            if (idx === -1) {
                donateList.push({
                    from: username,
                    amount,
                });
            } else {
                const oldAmount = parseInt(donateList[idx].amount.split('.')[0]);
                const newAmount = parseInt(amount.split('.')[0]);
                donateList[idx] = {
                    from: username,
                    amount:
                        (oldAmount + newAmount).toString() +
                        '.000 ' +
                        amount.split(' ')[1],
                };
            }
            setIn(state, path, donateList);
        },
        fetchingData(state, { payload: { order, category } }) {
            setIn(state, ['status', category || '', order], {
                fetching: true,
            });
        },
        receiveData(state, { payload }) {
            const {
                data,
                order,
                category,
                permlink: startPermLink,
                accountname,
                has_from_search,
                next_from,
            } = payload;

            const dataPath =
                order === 'by_author' ||
                order === 'by_feed' ||
                order === 'by_comments' ||
                order === 'by_replies'
                    ? ['accounts', accountname, category]
                    : ['discussion_idx', category || '', order];

            const links = [];
            data.map(v => {
                const link = `${v.author}/${v.permlink}`;
                if (!links.includes(link)) links.push(link);
            });

            if (startPermLink) {
                const posts = getIn(state, dataPath, []);
                for (const id of links.filter(id => !posts.includes(id))) {
                    posts.push(id);
                }
                setIn(state, dataPath, posts);
            } else {
                setIn(state, dataPath, links);
            }

            setIn(state, ['status', category || '', order], {
                fetching: false,
                ...(data.length < constants.FETCH_DATA_BATCH_SIZE
                    ? { lastFetch: Date.now() }
                    : {}),
            });

            state.has_from_search = has_from_search;
            state.next_from = next_from;
        },
        receiveRecentPosts(state, { payload: { data } }) {
            const path = ['discussion_idx', '', 'created'];
            const posts = getIn(state, path, []);
            for (const { author, permlink } of data) {
                const entry = `${author}/${permlink}`;
                if (!posts.includes(entry)) {
                    posts.unshift(entry);
                }
            }
            setIn(state, path, posts);
        },
        requestMeta(state, { payload: { id, link } }) {
            setIn(state, ['metaLinkData', id], { link });
        },
        receiveMeta(state, { payload: { id, meta } }) {
            setIn(state, ['metaLinkData', id], {
                ...getIn(state, ['metaLinkData', id], {}),
                ...meta,
            });
        },
        set(state, { payload: { key, value } }) {
            setIn(state, Array.isArray(key) ? key : [key], value);
        },
        remove(state, { payload: { key } }) {
            removeIn(state, Array.isArray(key) ? key : [key]);
        },
        update(state, { payload: { key, notSet = {}, updater } }) {
            updateIn(state, key, notSet, updater);
        },
        setMetaData(state, { payload: { id, meta } }) {
            setIn(state, ['metaLinkData', id], meta);
        },
        clearMeta(state, { payload: { id } }) {
            removeIn(state, ['metaLinkData', id]);
        },
        clearMetaElement(state, { payload: { formId, element } }) {
            removeIn(state, ['metaLinkData', formId, element]);
        },
        fetchJson() {},
        fetchExchangeRates() {},
        fetchJsonResult(state, { payload: { id, result, error } }) {
            state[id] = { result, error };
        },
        fetchVestingDelegations() {},
        showDialog(state, { payload: { name, params = {} } }) {
            if (!state.active_dialogs) state.active_dialogs = {};
            state.active_dialogs[name] = { params };
        },
        hideDialog(state, { payload: { name } }) {
            if (state.active_dialogs) {
                delete state.active_dialogs[name];
            }
        },
        receiveAccountVestingDelegations(
            state,
            { payload: { account, type, vesting_delegations } }
        ) {
            setIn(
                state,
                ['accounts', account, `${type}_vesting`],
                vesting_delegations
            );
        },
    },
    extraReducers: builder => {
        builder.addCase('@@router/LOCATION_CHANGE', (state, action) => {
            state.pathname = action.payload.pathname;
        });
    },
});

export default globalSlice;
