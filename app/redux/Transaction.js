import { createSlice } from '@reduxjs/toolkit';

import transactionErrorReducer from './Transaction_Error';
import { removeIn, setIn } from 'app/utils/PlainState';

const transactionSlice = createSlice({
    name: 'transaction',
    initialState: {
        operations: [],
        status: { key: '', error: false, busy: false },
        errors: null,
    },
    reducers: {
        confirmOperation(state, { payload }) {
            state.show_confirm_modal = true;
            state.confirmBroadcastOperation = payload.operation;
            state.confirmErrorCallback = payload.errorCallback;
            state.confirm = payload.confirm;
            state.warning = payload.warning;
        },
        hideConfirm(state) {
            state.show_confirm_modal = false;
            state.confirmBroadcastOperation = undefined;
            state.confirm = undefined;
        },
        broadcastOperation() {},
        updateAuthorities() {},
        updateMeta() {},
        error: transactionErrorReducer,
        deleteError(state, { payload: { key } }) {
            if (state.errors) {
                delete state.errors[key];
            }
        },
        set(state, { payload: { key, value } }) {
            setIn(state, Array.isArray(key) ? key : [key], value);
        },
        remove(state, { payload: { key } }) {
            removeIn(state, Array.isArray(key) ? key : [key]);
        },
    },
});

export default transactionSlice;
