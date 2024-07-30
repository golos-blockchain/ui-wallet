import { fork, call, put, takeLatest } from 'redux-saga/effects';
import MarketReducer from './MarketReducer';
import {getAccount} from './SagaShared';
import {api} from 'golos-lib-js';

export function* marketWatches() {
    yield fork(watchLocationChange);
    yield fork(watchUserLogin);
    yield fork(watchMarketUpdate);
}
 

const wait = ms => (
    new Promise(resolve => {
        setTimeout(() => resolve(), ms)
    }))

let polling = false
let hasData = false
let active_user = null
let last_trade = null

export function* fetchMarket(location_change_action) {
    const {pathname} = location_change_action.payload;
    if (pathname && !pathname.startsWith("/market")) {
        polling = false
        return
    }

    let parts = pathname.split('/')
    let sym1 = parts[2] || 'GOLOS'
    let sym2 = parts[3] || 'GBG'

    let assets;
    try {
        assets = yield call([api, api.getAssetsAsync], '', [], '', 5000, 'by_marketed')
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
    let kv_assets = {}
    for (const asset of assets) {
        kv_assets[asset.supply.split(" ")[1]] = asset
    }
    yield put(MarketReducer.actions.upsertAssets(kv_assets));

    if(polling && hasData) return
    polling = true

    while(polling) {
        try {
            const state = yield call([api, api.getOrderBookExtendedAsync], 500, [sym1, sym2]);
            yield put(MarketReducer.actions.receiveOrderbook(state));

            const trades = yield call([api, api.getTradeHistoryAsync], null, null, 1000, [sym1, sym2])
            yield put(MarketReducer.actions.receiveTradeHistory(trades))

            const state3 = yield call([api, api.getTickerAsync], [sym1, sym2]);
            yield put(MarketReducer.actions.receiveTicker(state3, [sym1, sym2]));

            hasData = true
        } catch (error) {
            console.error('~~ Saga fetchMarket error ~~>', error);
            yield put({type: 'global/CHAIN_API_ERROR', error: error.message});
        }

        yield call(wait, 3000);
    }
}

export function* fetchOpenOrders(set_user_action) {
    const {username, operationType} = set_user_action.payload // pathname only from reloadMarket 

    let isMarket = window && window.location.href.includes('/market')

    let pair = ["GOLOS", "GBG"] // for UserWallet (/@account/transfers)
    if (isMarket) {
        let parts = window.location.href.split('/')
        pair = [parts[4] || 'GOLOS', parts[5] || 'GBG']
    }

    try {
        if (!operationType) {
            const assets = (yield call([api, api.getAccountsBalancesAsync], [username]))[0]
            yield put(MarketReducer.actions.upsertAssets(assets));
            yield call(getAccount, username, true);
            const state = yield call([api, api.getOpenOrdersAsync], username, pair);
            yield put(MarketReducer.actions.receiveOpenOrders(state));
        }
    } catch (error) {
        console.error('~~ Saga fetchOpenOrders error ~~>', error);
        yield put({type: 'global/CHAIN_API_ERROR', error: error.message});
    }
}

export function* reloadMarket(reload_action) {
    yield fetchMarket(reload_action);
    yield fetchOpenOrders(reload_action);
}

export function* watchUserLogin() {
    yield takeLatest('user/SET_USER', fetchOpenOrders);
}

export function* watchLocationChange() {
    yield takeLatest('@@router/LOCATION_CHANGE', fetchMarket);
}

export function* watchMarketUpdate() {
    yield takeLatest('market/UPDATE_MARKET', reloadMarket);
}
