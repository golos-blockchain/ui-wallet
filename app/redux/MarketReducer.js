import { createSlice } from '@reduxjs/toolkit';

const marketSlice = createSlice({
    name: 'market',
    initialState: { status: {} },
    reducers: {
        updateMarket() {},
        receiveOrderbook(state, action) {
            state.orderbook = action.payload;
        },
        receiveTicker(state, action) {
            state.ticker = action.payload;
        },
        receiveOpenOrders(state, action) {
            state.open_orders = action.payload;
        },
        upsertAssets(state, action) {
            if (state.assets) {
                const actionAssets = Object.entries(action.payload);
                const stateAssets = Object.entries(state.assets);
                const moreAssets =
                    actionAssets.length > stateAssets.length
                        ? actionAssets
                        : stateAssets;
                const lowerAssets =
                    actionAssets.length > stateAssets.length
                        ? state.assets
                        : action.payload;

                const newAssets = {};
                for (const [key, value] of moreAssets) {
                    newAssets[key] = { ...value, ...lowerAssets[key] };
                }
                state.assets = newAssets;
            } else {
                state.assets = action.payload;
            }
        },
        receiveTradeHistory(state, action) {
            state.history = action.payload;
        },
        appendTradeHistory(state, action) {
            state.history = [...action.payload, ...(state.history || [])];
        },
    },
});

export default marketSlice;
