import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'universal-cookie';

import { DEFAULT_LANGUAGE, LOCALE_COOKIE_KEY } from 'app/client_config';
import { deepMerge, hasIn, removeIn, setIn } from 'app/utils/PlainState';

const defaultState = {
    current: null,
    show_login_modal: false,
    show_transfer_modal: false,
    show_convert_assets_modal: false,
    show_open_orders_modal: false,
    show_nft_orders_modal: false,
    show_change_account_modal: false,
    show_add_account_modal: false,
    show_app_download_modal: false,
    show_power_calc_modal: false,
    show_leave_golos_modal: false,
    pub_keys_used: null,
    locale: DEFAULT_LANGUAGE,
    nightmodeEnabled: false,
};

if (process.env.BROWSER) {
    const cookies = new Cookies();
    const locale = cookies.get(LOCALE_COOKIE_KEY);
    if (locale) defaultState.locale = locale;

    // TODO Чет нихера не цепляет при первой загрузке
    defaultState.nightmodeEnabled =
        localStorage.getItem('nightmodeEnabled') == 'true' || false;
}

const resetState = extra => ({
    ...defaultState,
    ...extra,
});

const userSlice = createSlice({
    name: 'user',
    initialState: defaultState,
    reducers: {
        requireLogin(state) {
            state.show_login_modal = true;
            state.loginDefault = {
                cancelIsRegister: true,
                loginRemind: true,
            };
        },
        showLogin(state, { payload }) {
            if (typeof payload === 'function') payload = undefined;
            state.show_login_modal = true;
            state.loginBroadcastOperation = payload && payload.operation;
            state.loginDefault = payload && payload.loginDefault;
        },
        hideLogin(state) {
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
        },
        saveLoginConfirm(state, { payload }) {
            state.saveLoginConfirm = payload;
        },
        saveLogin() {},
        getAccount() {},
        loadSavingsWithdraw() {},
        lookupPreviousOwnerAuthority() {},
        uploadImage() {},
        removeHighSecurityKeys(state) {
            if (!hasIn(state, ['current', 'private_keys'])) return;

            const privateKeys = state.current.private_keys;
            if (!privateKeys) {
                state.current.private_keys = null;
                return;
            }

            if (privateKeys.active_private) {
                console.log('removeHighSecurityKeys');
            }
            delete privateKeys.active_private;

            if (Object.keys(privateKeys).length === 0) {
                return resetState({ logged_out: true });
            }

            const username = state.current.username;
            if (!state.authority) state.authority = {};
            if (!state.authority[username]) state.authority[username] = {};
            state.authority[username].active = 'none';
            state.authority[username].owner = 'none';
        },
        changeCurrency(state, { payload }) {
            state.currency = payload;
        },
        changeLanguage(state, { payload }) {
            state.locale = payload;
        },
        toggleNightmode(state) {
            const nightmodeEnabled =
                localStorage.getItem('nightmodeEnabled') == 'true' || false;

            localStorage.setItem('nightmodeEnabled', !nightmodeEnabled);
            state.nightmodeEnabled = !nightmodeEnabled;
        },
        showTransfer(state) {
            state.show_transfer_modal = true;
        },
        hideTransfer(state) {
            state.show_transfer_modal = false;
        },
        setTransferDefaults(state, { payload }) {
            state.transfer_defaults = payload;
        },
        clearTransferDefaults(state) {
            delete state.transfer_defaults;
        },
        showConvertAssets(state) {
            state.show_convert_assets_modal = true;
        },
        hideConvertAssets(state) {
            state.show_convert_assets_modal = false;
        },
        setConvertAssetsDefaults(state, { payload }) {
            state.convert_assets_defaults = payload;
        },
        showPowerdown(state) {
            state.show_powerdown_modal = true;
        },
        hidePowerdown(state) {
            state.show_powerdown_modal = false;
        },
        setPowerdownDefaults(state, { payload }) {
            state.powerdown_defaults = payload;
        },
        clearPowerdownDefaults(state) {
            delete state.powerdown_defaults;
        },
        showOpenOrders(state) {
            state.show_open_orders_modal = true;
        },
        hideOpenOrders(state) {
            state.show_open_orders_modal = false;
        },
        setOpenOrdersDefaults(state, { payload }) {
            state.open_orders_defaults = payload;
        },
        showNftOrders(state) {
            state.show_nft_orders_modal = true;
        },
        hideNftOrders(state) {
            state.show_nft_orders_modal = false;
        },
        showChangeAccount(state) {
            state.show_change_account_modal = true;
        },
        hideChangeAccount(state) {
            state.show_change_account_modal = false;
        },
        showAddAccount(state) {
            state.show_add_account_modal = true;
        },
        hideAddAccount(state) {
            state.show_add_account_modal = false;
        },
        showAppDownload(state) {
            state.show_app_download_modal = true;
        },
        hideAppDownload(state) {
            state.show_app_download_modal = false;
        },
        showPowerCalc(state) {
            state.show_power_calc_modal = true;
        },
        hidePowerCalc(state) {
            state.show_power_calc_modal = false;
        },
        setPowerCalcDefaults(state, { payload }) {
            state.power_calc_defaults = payload;
        },
        showLeaveGolos(state, { payload }) {
            state.show_leave_golos_modal = true;
            state.leave_golos_defaults = payload;
        },
        hideLeaveGolos(state) {
            state.show_leave_golos_modal = false;
        },
        usernamePasswordLogin() {
        },
        changeAccount() {},
        setUser(state, { payload }) {
            if (payload.vesting_shares)
                payload.vesting_shares = parseFloat(payload.vesting_shares);
            if (payload.delegated_vesting_shares)
                payload.delegated_vesting_shares = parseFloat(
                    payload.delegated_vesting_shares
                );
            if (payload.received_vesting_shares)
                payload.received_vesting_shares = parseFloat(
                    payload.received_vesting_shares
                );

            state.current = deepMerge(state.current, payload);
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
            state.logged_out = undefined;
        },
        closeLogin(state) {
            state.login_error = undefined;
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
        },
        loginError(state, { payload: { error, ...rest } }) {
            state.login_error = { error, ...rest };
            state.login_state = 0;
            state.logged_out = undefined;
        },
        loginState(state, { payload }) {
            state.login_state = payload.state;
        },
        logout() {
            return resetState({ logged_out: true });
        },
        keysError(state, { payload: { error } }) {
            state.keys_error = error;
        },
        accountAuthLookup() {},
        setAuthority(state, { payload: { accountName, auth, pub_keys_used } }) {
            if (!state.authority) state.authority = {};
            state.authority[accountName] = auth;
            if (pub_keys_used) {
                state.pub_keys_used = pub_keys_used;
            }
        },
        hideConnectionErrorModal(state) {
            state.hide_connection_error_modal = true;
        },
        set(state, { payload: { key, value } }) {
            setIn(state, Array.isArray(key) ? key : [key], value);
        },
        remove(state, { payload: { key } }) {
            removeIn(state, Array.isArray(key) ? key : [key]);
        },
        notificationChannelCreated(state) {
            state.notification_channel_created = true;
        },
        notificationChannelDestroyed(state) {
            state.notification_channel_created = false;
        },
    },
});

export default userSlice;
