/* eslint react/display-name: 0 */
/* eslint space-before-function-paren:0 */
// https://github.com/eslint/eslint/issues/4442
import React from 'react';
import { render } from 'react-dom';
import {
    Router,
    RouterContext,
    match,
    applyRouterMiddleware
} from 'react-router';
import { Provider } from 'react-redux';
import RootRoute from 'app/RootRoute';
import { configureStore } from '@reduxjs/toolkit';
import { browserHistory } from 'react-router';
import { useScroll } from 'react-router-scroll';
import createSagaMiddleware from 'redux-saga';
import { syncHistoryWithStore } from 'react-router-redux';
import g from 'app/redux/GlobalReducer'
import rootReducer from 'app/redux/RootReducer';
import rootSaga from 'app/redux/RootSaga';
import user from 'app/redux/User';
import {component as NotFound} from 'app/components/pages/NotFound';
import Translator from 'app/Translator';
import {routeRegex} from "app/ResolveRoute";
import {APP_NAME, SEO_TITLE} from 'app/client_config';
import constants from 'app/redux/constants';
import session, { isLoginPage } from 'app/utils/session'

const sagaMiddleware = createSagaMiddleware();

const onRouterError = (error) => {
    console.error('onRouterError', error);
};

export default async function renderWrapper(initialState) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: initialState,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: false,
                immutableCheck: false,
                serializableCheck: false,
            }).concat(sagaMiddleware),
        devTools: process.env.BROWSER && process.env.NODE_ENV === 'development',
    });
    sagaMiddleware.run(rootSaga)

    const history = syncHistoryWithStore(browserHistory, store);

    window.store = {
        getState: () => { debugger }
    }
    window._reduxStore = store;
    // Bump transaction (for live UI testing).. Put 0 in now (no effect),
    // to enable browser's autocomplete and help prevent typos.
    window.bump = parseInt(localStorage.getItem('bump') || 0);
    const scroll = useScroll((prevLocation, { location }) => {
        if (location.hash || location.action === 'POP') return false;
        return !prevLocation || prevLocation.location.pathname !== location.pathname;
    });

    if (process.env.NODE_ENV === 'production') {
        // console.log('%c%s', 'color: red; background: yellow; font-size: 24px;', 'WARNING!');
        // console.log('%c%s', 'color: black; font-size: 16px;', 'This is a developer console, you must read and understand anything you paste or type here or you could compromise your account and your private keys.');
    }

    const Wrapper =
        process.env.NODE_ENV !== 'production' && localStorage['react.strict']
            ? React.StrictMode
            : React.Fragment;

    const currentName = session.load().currentName
    if (!currentName) {
        const params = new URLSearchParams(window.location.search)
        if (params.get('dialog') === 'change-password') {
            store.dispatch(g.actions.showDialog({ name: 'changePassword', params: { username: params.get('name') || null } }))
        } else if (!isLoginPage()) {
            const lastClosed = parseInt(localStorage.getItem('login_closed') || 0)
            const interval = 24*60*60*1000 // 1 day
            if ((Date.now() - lastClosed) > interval) {
                store.dispatch(user.actions.requireLogin())
            }
        }
    }

    return render(
        <Wrapper>
            <Provider store={store}>
                <Translator>
                    <Router
                        routes={RootRoute}
                        history={history}
                        onError={onRouterError}
                        render={applyRouterMiddleware(scroll)}
                    />
                </Translator>
            </Provider>
        </Wrapper>,
        document.getElementById('content')
    );
}
