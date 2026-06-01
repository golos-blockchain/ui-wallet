import { createSlice } from '@reduxjs/toolkit';
import tt from 'counterpart';

const defaultState = {
    requests: {},
    loading: false,
    error: '',
    location: {},
    ignoredLoadingRequestCount: 0,
    notificounters: {
        total: 0,
        feed: 0,
        reward: 0,
        send: 0,
        mention: 0,
        follow: 0,
        vote: 0,
        reply: 0,
        account_update: 0,
        message: 0,
        receive: 0,
        donate: 0,
    },
};

const appSlice = createSlice({
    name: 'app',
    initialState: defaultState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase('@@router/LOCATION_CHANGE', (state, action) => {
                state.location = { pathname: action.payload.pathname };
            })
            .addCase('CHAIN_API_ERROR', (state, action) => {
                state.error = action.error;
            })
            .addCase('FETCH_DATA_BEGIN', state => {
                state.loading = true;
            })
            .addCase('FETCH_DATA_END', state => {
                state.loading = false;
            })
            .addCase('UPDATE_NOTIFICOUNTERS', (state, action) => {
                if (!action.payload) {
                    return;
                }
                const nc = { ...action.payload };
                if (nc.follow > 0) {
                    nc.total -= nc.follow;
                    nc.follow = 0;
                }
                state.notificounters = nc;
            });
    },
});

export default appSlice.reducer;
