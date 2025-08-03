import {fromJS, Set, List} from 'immutable'
import { call, put, select, fork, takeLatest, takeEvery } from 'redux-saga/effects';
import {accountAuthLookup} from 'app/redux/AuthSaga'
import appRed from 'app/redux/AppReducer'
import user from 'app/redux/User'
import {getAccount} from 'app/redux/SagaShared'
import {browserHistory} from 'react-router'
import { authApiLogin, authApiLogout, authSession } from 'app/utils/AuthApiClient';
import { notifyApiLogin, notifyApiLogout, notifySession, notificationUnsubscribe } from 'app/utils/NotifyApiClient';
import {serverApiLogin, serverApiLogout} from 'app/utils/ServerApiClient';
import {serverApiRecordEvent} from 'app/utils/ServerApiClient';
import { signData } from 'golos-lib-js/lib/auth'
import {PrivateKey, Signature, hash} from 'golos-lib-js/lib/auth/ecc'
import {api, config} from 'golos-lib-js'
import g from 'app/redux/GlobalReducer'
import React from 'react';
import PushNotificationSaga from 'app/redux/services/PushNotificationSaga';
import uploadImageWatch from './UserSaga_UploadImage';
import session from 'app/utils/session'

export function* userWatches() {
    yield fork(watchRemoveHighSecurityKeys); // keep first to remove keys early when a page change happens
    yield fork(loginWatch);
    yield fork(changeAccountWatch)
    yield fork(saveLoginWatch);
    yield fork(logoutWatch);
    yield fork(getAccountWatch);
    yield fork(loginErrorWatch);
    yield fork(lookupPreviousOwnerAuthorityWatch);
    yield fork(watchLoadSavingsWithdraw);
    yield fork(uploadImageWatch);
}
    


const highSecurityPages = Array(/\/market/, /\/@.+\/(transfers|assets|permissions|invites|password)/, /\/~witnesses/)

function* lookupPreviousOwnerAuthorityWatch() {
    yield takeLatest('user/lookupPreviousOwnerAuthority', lookupPreviousOwnerAuthority);
}
function* loginWatch() {
    yield takeLatest('user/USERNAME_PASSWORD_LOGIN', usernamePasswordLogin);
}
function* changeAccountWatch() {
    yield takeLatest('user/CHANGE_ACCOUNT', changeAccount);
}
function* saveLoginWatch() {
    yield takeLatest('user/SAVE_LOGIN', saveLogin_localStorage);
}
function* logoutWatch() {
    yield takeLatest('user/LOGOUT', logout);
}

function* loginErrorWatch() {
    yield takeLatest('user/LOGIN_ERROR', loginError);
}

function* watchLoadSavingsWithdraw() {
    yield takeLatest('user/LOAD_SAVINGS_WITHDRAW', loadSavingsWithdraw);
}

export function* watchRemoveHighSecurityKeys() {
    yield takeLatest('@@router/LOCATION_CHANGE', removeHighSecurityKeys);
}

function* loadSavingsWithdraw() {
    const username = yield select(state => state.user.getIn(['current', 'username']))
    const to = yield call([api, api.getSavingsWithdrawToAsync], username)
    const fro = yield call([api, api.getSavingsWithdrawFromAsync], username)

    const m = {}
    for(const v of to) m[v.id] = v
    for(const v of fro) m[v.id] = v

    const withdraws = List(fromJS(m).values())
        .sort((a, b) => strCmp(a.get('complete'), b.get('complete')))

    yield put(user.actions.set({
        key: 'savings_withdraws',
        value: withdraws,
    }))
}

const strCmp = (a, b) => a > b ? 1 : a < b ? -1 : 0

// function* getCurrentAccountWatch() {
//     // yield takeLatest('user/SHOW_TRANSFER', getCurrentAccount);
// }
function* getAccountWatch() {
    yield takeEvery('user/GET_ACCOUNT', getAccountHandler);
}

function* removeHighSecurityKeys({payload: {pathname}}) {
    const highSecurityPage = highSecurityPages.find(p => p.test(pathname)) != null
    // Let the user keep the active key when going from one high security page to another.  This helps when
    // the user logins into the Wallet then the Permissions tab appears (it was hidden).  This keeps them
    // from getting logged out when they click on Permissions (which is really bad because that tab
    // disappears again).
    if(!highSecurityPage)
        yield put(user.actions.removeHighSecurityKeys())
}

/**
    @arg {object} action.username - Unless a WIF is provided, this is hashed with the password and key_type to create private keys.
    @arg {object} action.password - Password or WIF private key.  A WIF becomes the posting key, a password can create all three
        key_types: active, owner, posting keys.
*/
function* usernamePasswordLogin(action) {
  // todo transform this into middleware?
  // consider the special situation (external transfer)
  // get current path from router
  // const pathname = yield select(state => state.global.get('pathname'))
  const currentLocation = yield select(state => state.routing)//.get(`locationBeforeTransitions`));
  const { locationBeforeTransitions: { pathname, query } } = currentLocation;
  const sender = pathname.split(`/`)[1].substring(1);
  const {to, amount, token, memo} = query;
  const externalTransferRequested = (!!to && !!amount && !!token && !!memo);
  const offchain_account = yield select(state => state.offchain.get('account'))
  let preventLogin = false;
  if (externalTransferRequested) {
    if (offchain_account) {
      if (offchain_account !== sender)
        preventLogin = true
    }
  }

  if (preventLogin) {
    return
  }

  // Sets 'loading' while the login is taking place.  The key generation can take a while on slow computers.
    yield call(usernamePasswordLogin2, action)
    const current = yield select(state => state.user.get('current'))
    if (current) {
        const username = current.get('username')
        if (process.env.BROWSER) {
            const { onUserLogin } = PushNotificationSaga
            yield call(onUserLogin, { username })
        }
    }
}

const clean = (value) => value == null || value === '' || /null|undefined/.test(value) ? undefined : value

function* usernamePasswordLogin2({payload: {username, password, saveLogin,
        operationType, highSecurityLogin, afterLoginRedirectToWelcome
}}) {
    // login, using saved password
    let autopost, memoWif, login_owner_pubkey, login_wif_owner_pubkey
    if (!username && !password) {
        const data = session.load()
        if (data.currentName) { // auto-login with a low security key (like a posting key)
            autopost = true; // must use simi-colon
            // The 'password' in this case must be the posting private wif
            username = data.currentName
            password = data.getVal(username, 'posting')
            memoWif = data.getVal(username, 'memo')
            login_owner_pubkey = data.getVal(username, 'login_owner_pubkey')
            memoWif = clean(memoWif);
            login_owner_pubkey = clean(login_owner_pubkey);
        }
    }
    // no saved password
    if (!username || !password) {
        const offchain_account = yield select(state => state.offchain.get('account'))
        if (offchain_account) {
            notifyApiLogout()
            authApiLogout()
            serverApiLogout()
        }
        return
    }

    let userProvidedRole // login via:  username/owner
    if (username.indexOf('/') > -1) {
        // "alice/active" will login only with Alices active key
        [username, userProvidedRole] = username.split('/')
    }

    const isRole = (role, fn) => (!userProvidedRole || role === userProvidedRole ? fn() : undefined)

    let account
    try {
        account = yield call(getAccount, username)
    } catch (err) {
        console.error(err)
        yield put(user.actions.loginError({ error: 'Node failure', node: config.get('websocket') }))
        return
    }
    if (!account) {
        yield put(user.actions.loginError({ error: 'Username does not exist' }))
        return
    }
    if (account.get('frozen')) {
        account = yield call(getAccount, username, true)
        if (account.get('frozen')) {
            yield put(user.actions.loginError({ error: 'account_frozen' }))
            return
        }
    }

    let private_keys
    try {
        const private_key = PrivateKey.fromWif(password)
        login_wif_owner_pubkey = private_key.toPublicKey().toString()
        private_keys = fromJS({
            posting_private: isRole('posting', () => private_key),
            active_private: isRole('active', () => private_key),
            memo_private: private_key,
        })
    } catch (e) {
        // Password (non wif)
        login_owner_pubkey = PrivateKey.fromSeed(username + 'owner' + password).toPublicKey().toString()
        private_keys = fromJS({
            posting_private: isRole('posting', () => PrivateKey.fromSeed(username + 'posting' + password)),
            active_private: isRole('active', () => PrivateKey.fromSeed(username + 'active' + password)),
            memo_private: PrivateKey.fromSeed(username + 'memo' + password),
        })
    }
    if (memoWif)
        private_keys = private_keys.set('memo_private', PrivateKey.fromWif(memoWif))

    yield call(accountAuthLookup, {payload: {account, private_keys, highSecurityLogin, login_owner_pubkey}})
    let authority = yield select(state => state.user.getIn(['authority', username]))
    const hasActiveAuth = authority.get('active') === 'full'
    // Forbid loging in with active key
    if(!operationType && !highSecurityLogin) {
        const accountName = account.get('name')
        authority = authority.set('active', 'none')
        yield put(user.actions.setAuthority({accountName, auth: authority}))
    }
    const fullAuths = authority.reduce((r, auth, type) => (auth === 'full' ? r.add(type) : r), Set())
    if (!fullAuths.size) {
        session.logout(username)
        const owner_pub_key = account.getIn(['owner', 'key_auths', 0, 0]);
        // const pub_keys = yield select(state => state.user.get('pub_keys_used'))
        // serverApiRecordEvent('login_attempt', JSON.stringify({name: username, ...pub_keys, cur_owner: owner_pub_key}))
        // FIXME pls parameterize opaque things like this into a constants file
        // code like this requires way too much historical knowledge to
        // understand.
        if (owner_pub_key === 'STM7sw22HqsXbz7D2CmJfmMwt9rimtk518dRzsR1f8Cgw52dQR1pR') {
            yield put(user.actions.loginError({ error: 'Hello. Your account may have been compromised. We are working on restoring an access to your account. Please send an email to t@cyber.fund.' }))
            return
        }
        if(login_owner_pubkey === owner_pub_key || login_wif_owner_pubkey === owner_pub_key) {
            yield put(user.actions.loginError({ error: 'owner_login_blocked' }))
        } else if(!highSecurityLogin && hasActiveAuth) {
            yield put(user.actions.loginError({ error: 'active_login_blocked' }))
        } else {
            const generated_type = password[0] === 'P' && password.length > 40;
            serverApiRecordEvent('login_attempt', JSON.stringify({name: username, login_owner_pubkey, owner_pub_key, generated_type}))
            yield put(user.actions.loginError({ error: 'Incorrect Password' }))
        }
        return
    }
    if (authority.get('posting') !== 'full')
        private_keys = private_keys.remove('posting_private')

    const pathname = yield select(state => state.global.get('pathname'))
    
    if((!highSecurityLogin || authority.get('active') !== 'full') && !pathname.endsWith('/permissions'))
        private_keys = private_keys.remove('active_private')

    const owner_pubkey = account.getIn(['owner', 'key_auths', 0, 0])
    const active_pubkey = account.getIn(['active', 'key_auths', 0, 0])
    const posting_pubkey = account.getIn(['posting', 'key_auths', 0, 0])

    if (private_keys.get('memo_private') &&
        account.get('memo_key') !== private_keys.get('memo_private').toPublicKey().toString()
    )
        // provided password did not yield memo key
        private_keys = private_keys.remove('memo_private')

    if(!highSecurityLogin) {
        if(
            posting_pubkey === owner_pubkey ||
            posting_pubkey === active_pubkey
        ) {
            yield put(user.actions.loginError({ error: 'This login gives owner or active permissions and should not be used here.  Please provide a posting only login.' }))
            session.logout(username)
            return
        }
    }
    const memo_pubkey = private_keys.has('memo_private') ?
        private_keys.get('memo_private').toPublicKey().toString() : null

    /*if(
        memo_pubkey === owner_pubkey ||
        memo_pubkey === active_pubkey
    )
        // Memo key could be saved in local storage.. In RAM it is not purged upon LOCATION_CHANGE
        private_keys = private_keys.remove('memo_private')*/

    // If user is signing operation by operaion and has no saved login, don't save to RAM
    if(!operationType) {
        // Keep the posting key in RAM but only when not signing an operation.
        // No operation or the user has checked: Keep me logged in...
        yield put(
            user.actions.setUser({
                username,
                private_keys,
                login_owner_pubkey,
                vesting_shares: account.get('vesting_shares'),
                received_vesting_shares: account.get('received_vesting_shares'),
                delegated_vesting_shares: account.get('delegated_vesting_shares')
            })
        )
    } else {
        yield put(
            user.actions.setUser({
                username,
                operationType,
                vesting_shares: account.get('vesting_shares'),
                received_vesting_shares: account.get('received_vesting_shares'),
                delegated_vesting_shares: account.get('delegated_vesting_shares')
            })
        )
    }

    const memoAuth = private_keys.get('memo_private') && private_keys.get('memo_private').toWif() === password;
    if (!autopost && saveLogin && !operationType)
        yield put(user.actions.saveLogin());

    const loginTm = setTimeout(async () => {
        const message = 'Вход выполняется дольше обычного.\nВозможно, вам стоит попробовать другое устройство или другой интернет (например, Wi-Fi вместо мобильной сети).'
        if (window._reduxStore) {
            const now = Date.now();
            const lbnKey = 'last_bad_item';
            const lastBadNet = parseInt(localStorage.getItem(lbnKey) || 0);
            if (now - lastBadNet >= 10*60*1000) {
                localStorage.setItem(lbnKey, now);
                window._reduxStore.dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: {
                        key: 'bad_net_' + Date.now(),
                        message,
                        dismissAfter: 5000
                    }
                })
            }
        } else if (!afterLoginRedirectToWelcome) {
            alert(message)
        }
    }, 2000)

    yield new Promise(resolve => setTimeout(resolve, 40000));

    let alreadyAuthorized = false;
    try {
        const res = yield notifyApiLogin(username, localStorage.getItem('X-Auth-Session'));
        alreadyAuthorized = (res.status === 'ok');
    } catch(error) {
        // Does not need to be fatal
        console.error('Notify Login Checking Error', error);
        alreadyAuthorized = null;
    }
    if (alreadyAuthorized === false) {
        let authorized = false;
        try {
            const res = yield authApiLogin(username, null);
            if (res.already_authorized !== username) {
                console.log('login_challenge', res.login_challenge);

                const challenge = {token: res.login_challenge};
                const signatures = signData(JSON.stringify(challenge, null, 0), {
                    posting: private_keys.get('posting_private'),
                });
                const res2 = yield authApiLogin(username, signatures);
                if (res2.guid) {
                    localStorage.setItem('guid', res2.guid)
                }
                if (res2.status === 'ok') {
                    authorized = true;
                } else {
                    throw new Error(JSON.stringify(res2)); 
                }
            }
        } catch(error) {
            // Does not need to be fatal
            console.error('Auth Login Error', error);
        }

        if (authorized)
            try {
                const res = yield notifyApiLogin(username, localStorage.getItem('X-Auth-Session'));

                if (res.status !== 'ok') {
                    throw new Error(res); 
                }
            } catch(error) {
                // Does not need to be fatal
                console.error('Notify Login Error', error);
            }
    }
    try {
        const offchainData = yield select(state => state.offchain)
        const serverAccount = offchainData.get('account')
        if (!serverAccount) {
            serverApiLogin(username);
        }
    } catch(error) {
        // Does not need to be fatal
        console.error('Server Login Error', error);
    }
    clearTimeout(loginTm);
    if (afterLoginRedirectToWelcome) {
      browserHistory.push('/@' + username)
    }
}

function* changeAccount(action) {
    const { currentName } = session.load()
    if (currentName) {
        try {
            yield notificationUnsubscribe(currentName, '__notify_id')
        } catch (err) {}
        try {
            notifyApiLogout()
            authApiLogout()
            serverApiLogout()
        } catch (err) {}
    }
    const { payload: { username, password } } = action
    yield put(user.actions.usernamePasswordLogin({username, password, saveLogin: true }))
}

function* saveLogin_localStorage() {
    if (!process.env.BROWSER) {
        console.error('Non-browser environment, skipping localstorage')
        return
    }
    const [username, private_keys, login_owner_pubkey] = yield select(state => ([
        state.user.getIn(['current', 'username']),
        state.user.getIn(['current', 'private_keys']),
        state.user.getIn(['current', 'login_owner_pubkey']),
    ]))
    if (!username) {
        session.logout(username)
        console.error('Not logged in')
        return
    }
    // Save the lowest security key
    const posting_private = private_keys.get('posting_private')
    if (!posting_private) {
        session.logout(username)
        console.error('No posting key to save?')
        return
    }
    const account = yield select(state => state.global.getIn(['accounts', username]))
    if(!account) {
        session.logout(username)
        console.error('Missing global.accounts[' + username + ']')
        return
    }
    const postingPubkey = posting_private.toPublicKey().toString()
    try {
        account.getIn(['active', 'key_auths']).forEach(auth => {
            if(auth.get(0) === postingPubkey)
                throw 'Login will not be saved, posting key is the same as active key'
        })
        account.getIn(['owner', 'key_auths']).forEach(auth => {
            if(auth.get(0) === postingPubkey)
                throw 'Login will not be saved, posting key is the same as owner key'
        })
    } catch(e) {
        session.logout(username)
        console.error(e)
        return
    }
    const memoKey = private_keys.get('memo_private')
    try {
        session.load()
            .addKey(username, 'posting', posting_private)
            .addKey(username, 'memo', memoKey)
            .setVal(username, 'login_owner_pubkey', login_owner_pubkey)
            .setCurrent(username)
            .save()
    } catch(e){
        console.error(e)
    }
}

function* logout() {
    yield put(user.actions.saveLoginConfirm(false)) // Just incase it is still showing
    if (process.env.BROWSER) {
        const curName = session.load().currentName
        if (curName) {
            const newCurrent = {}
            session.logout(curName, newCurrent).save()
            try {
                yield notificationUnsubscribe(curName, '__notify_id')
            } catch (err) {}
            if (newCurrent.name) {
                const password = newCurrent.data.posting
                yield put(user.actions.usernamePasswordLogin({ username: newCurrent.name, password, saveLogin: true }))
                return
            }
        }
        localStorage.removeItem('guid')
        authApiLogout();
        notifyApiLogout();
        serverApiLogout();
    }
}

function* loginError({payload: {/*error*/}}) {
    notifyApiLogout();
    serverApiLogout();
}

/**
    If the owner key was changed after the login owner key, this function will find the next owner key history record after the change and store it under user.previous_owner_authority.
*/
function* lookupPreviousOwnerAuthority({payload: {}}) {
    const current = yield select(state => state.user.get('current'))
    if(!current) return

    const login_owner_pubkey = current.get('login_owner_pubkey')
    if(!login_owner_pubkey) return

    const username = current.get('username')
    const key_auths = yield select(state => state.global.getIn(['accounts', username, 'owner', 'key_auths']))
    if (key_auths && key_auths.find(key => key.get(0) === login_owner_pubkey)) {
        // console.log('UserSaga ---> Login matches current account owner');
        return
    }
    // Owner history since this index was installed July 14
    let owner_history = fromJS(yield call([api, api.getOwnerHistoryAsync], username))
    if(owner_history.count() === 0) return
    owner_history = owner_history.sort((b, a) => {//sort decending
        const aa = a.get('last_valid_time')
        const bb = b.get('last_valid_time')
        return aa < bb ? -1 : aa > bb ? 1 : 0
    })
    // console.log('UserSaga ---> owner_history', owner_history.toJS())
    const previous_owner_authority = owner_history.find(o => {
        const auth = o.get('previous_owner_authority')
        const weight_threshold = auth.get('weight_threshold')
        const key3 = auth.get('key_auths').find(key2 => key2.get(0) === login_owner_pubkey && key2.get(1) >= weight_threshold)
        return key3 ? auth : null
    })
    if(!previous_owner_authority) {
        console.log('UserSaga ---> Login owner does not match owner history');
        return
    }
    // console.log('UserSage ---> previous_owner_authority', previous_owner_authority.toJS())
    yield put(user.actions.setUser({previous_owner_authority}))
}

function* getAccountHandler({ payload: { usernames, resolve, reject }}) {
    if (!usernames) {
        const current = yield select(state => state.user.get('current'))
        if (!current) return
        usernames = [current.get('username')]
    }

    const accounts = yield call([api, api.getAccountsAsync], usernames)
    yield accounts.map((account) => put(g.actions.receiveAccount({ account })))
    if (resolve && accounts[0]) {
        resolve(accounts);
    } else if (reject && !accounts[0]) {
        reject();
    }
}
