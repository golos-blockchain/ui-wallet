import {Map, fromJS} from 'immutable';
import { combineReducers, __DO_NOT_USE__ActionTypes as ActionTypes } from 'redux';
import {routerReducer} from 'react-router-redux';
import appReducer from './AppReducer';
import globalReducerModule from './GlobalReducer';
import marketReducerModule from './MarketReducer';
import user from './User';
import transaction from './Transaction';
import offchain from './Offchain';
import { fromJSGreedy } from 'app/utils/StateFunctions'

function initReducer(reducer, type) {
    return (state, action) => {
        if(!state) {
            state = reducer(state, action)
            return state
        }

        // @@redux/INIT server and client init
        if (action.type === ActionTypes.INIT || action.type === '@@INIT') {
            if(!(state instanceof Map)) {
                state = fromJS(state);
            }
            return state;
        }

        if (action.type === '@@router/LOCATION_CHANGE' && type === 'global') {
            state = state.set('pathname', action.payload.pathname)
            // console.log(action.type, type, action, state.toJS())
        }

        return reducer(state, action);
    }
}

export default combineReducers({
    global: initReducer(globalReducerModule.reducer, 'global'),
    market: initReducer(marketReducerModule.reducer),
    offchain: initReducer(offchain),
    user: initReducer(user.reducer),
    transaction: initReducer(transaction.reducer),
    discussion: initReducer((state = {}) => state),
    routing: initReducer(routerReducer),
    app: initReducer(appReducer),
});

/*
let now
    benchStart: initReducer((state = {}, action) => {console.log('>> action.type', action.type); now = Date.now(); return state}),
    benchEnd: initReducer((state = {}, action) => {console.log('<< action.type', action.type, (Date.now() - now), 'ms'); return state}),
*/
