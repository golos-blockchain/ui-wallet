import { combineReducers } from '@reduxjs/toolkit';
import {routerReducer} from 'react-router-redux';
import appReducer from './AppReducer';
import globalReducerModule from './GlobalReducer';
import marketReducerModule from './MarketReducer';
import user from './User';
import transaction from './Transaction';
import offchain from './Offchain';

export default combineReducers({
    global: globalReducerModule.reducer,
    market: marketReducerModule.reducer,
    offchain,
    user: user.reducer,
    transaction: transaction.reducer,
    discussion: (state = {}) => state,
    routing: routerReducer,
    app: appReducer,
});

/*
let now
    benchStart: initReducer((state = {}, action) => {console.log('>> action.type', action.type); now = Date.now(); return state}),
    benchEnd: initReducer((state = {}, action) => {console.log('<< action.type', action.type, (Date.now() - now), 'ms'); return state}),
*/
