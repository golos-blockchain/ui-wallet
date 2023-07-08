import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';

import ConvertAssets from 'app/components/modules/ConvertAssets'
import LoginForm from 'app/components/modules/LoginForm';
import ConfirmTransactionForm from 'app/components/modules/ConfirmTransactionForm';
import Transfer from 'app/components/modules/Transfer';
import ChangeAccount from 'app/components/modules/ChangeAccount'
import AddAccount from 'app/components/modules/AddAccount'
import AppDownload from 'app/components/modules/app/AppDownload'
import user from 'app/redux/User';
import tr from 'app/redux/Transaction';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import PowerCalc from 'app/components/modules/PowerCalc'
import Powerdown from 'app/components/modules/Powerdown';
import OpenOrders from 'app/components/modules/OpenOrders';

let keyIndex = 0;

class Modals extends React.Component {
    static propTypes = {
        show_login_modal: PropTypes.bool,
        show_confirm_modal: PropTypes.bool,
        show_transfer_modal: PropTypes.bool,
        show_convert_assets_modal: PropTypes.bool,
        show_powerdown_modal: PropTypes.bool,
        show_change_account_modal: PropTypes.bool,
        show_add_account_modal: PropTypes.bool,
        show_app_download_modal: PropTypes.bool,
        show_power_calc_modal: PropTypes.bool,
        hideLogin: PropTypes.func.isRequired,
        hideConfirm: PropTypes.func.isRequired,
        hideTransfer: PropTypes.func.isRequired,
        hidePowerdown: PropTypes.func.isRequired,
        hidePowerCalc: PropTypes.func.isRequired,
        hideAppDownload: PropTypes.func.isRequired,
        notifications: PropTypes.object,
        removeNotification: PropTypes.func,
        show_open_orders_modal: PropTypes.bool,
        hideOpenOrders: PropTypes.func.isRequired,
    };

    constructor() {
        super();
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Modals');
    }

    onLoginBackdropClick = (e) => {
        const { loginUnclosable } = this.props;
        if (loginUnclosable)
            throw new Error('Closing login modal is forbidden here');
    };

    render() {
        const {
            show_login_modal,
            show_confirm_modal,
            show_transfer_modal,
            show_convert_assets_modal,
            show_powerdown_modal,
            show_change_account_modal,
            show_add_account_modal,
            show_app_download_modal,
            show_power_calc_modal,
            hideLogin,
            hideTransfer,
            hideConvertAssets,
            hidePowerdown,
            hideConfirm,
            hideChangeAccount,
            hideAddAccount,
            hideAppDownload,
            hidePowerCalc,
            notifications,
            removeNotification,
            show_open_orders_modal,
            hideOpenOrders,
        } = this.props;

        const notifications_array = notifications ? notifications.toArray().map(n => {
            if (!n.key) {
                n.key = ++keyIndex;
            }
            n.onClick = () => removeNotification(n.key);
            return n;
        }) : [];

        return (
            <div>
                {show_login_modal && <Reveal onBackdropClick={this.onLoginBackdropClick} onHide={hideLogin} show={show_login_modal}>
                    <LoginForm onCancel={hideLogin} />
                </Reveal>}
                {show_confirm_modal && <Reveal onHide={hideConfirm} show={show_confirm_modal}>
                    <CloseButton onClick={hideConfirm} />
                    <ConfirmTransactionForm onCancel={hideConfirm} />
                </Reveal>}
                {show_transfer_modal && <Reveal onHide={hideTransfer} show={show_transfer_modal}>
                    <CloseButton onClick={hideTransfer} />
                    <Transfer />
                </Reveal>}
                {show_convert_assets_modal && <Reveal onHide={hideConvertAssets} show={show_convert_assets_modal}>
                    <CloseButton onClick={hideConvertAssets} />
                    <ConvertAssets modal={true} />
                </Reveal>}
                {show_powerdown_modal && (
                    <Reveal onHide={hidePowerdown} show={show_powerdown_modal}>
                        <CloseButton onClick={hidePowerdown} />
                        <Powerdown />
                    </Reveal>
                )}
                {show_open_orders_modal && <Reveal onHide={hideOpenOrders} show={show_open_orders_modal} size="large" revealClassName="OpenOrders">
                    <CloseButton onClick={hideOpenOrders} />
                    <OpenOrders />
                </Reveal>}
                {show_change_account_modal && <Reveal onHide={hideChangeAccount} show={show_change_account_modal} revealStyle={{ width: '400px' }}>
                    <CloseButton onClick={hideChangeAccount} />
                    <ChangeAccount />
                </Reveal>}
                {show_add_account_modal && <Reveal onHide={hideAddAccount} show={show_add_account_modal}>
                    <CloseButton onClick={hideAddAccount} />
                    <AddAccount />
                </Reveal>}
                {show_power_calc_modal && <Reveal onHide={hidePowerCalc} show={show_power_calc_modal}>
                    <CloseButton onClick={hidePowerCalc} />
                    <PowerCalc />
                </Reveal>}
                {show_app_download_modal && <Reveal onHide={hideAppDownload} show={show_app_download_modal}>
                    <CloseButton onClick={hideAppDownload} />
                    <AppDownload />
                </Reveal>}
            </div>
        );
    }
}

export default connect(
    state => {
        const loginDefault = state.user.get('loginDefault');
        const loginUnclosable = loginDefault && loginDefault.get('unclosable');
        return {
            show_login_modal: state.user.get('show_login_modal'),
            loginUnclosable,
            show_confirm_modal: state.transaction.get('show_confirm_modal'),
            show_transfer_modal: state.user.get('show_transfer_modal'),
            show_convert_assets_modal: state.user.get('show_convert_assets_modal'),
            show_power_calc_modal: state.user.get('show_power_calc_modal'),
            show_powerdown_modal: state.user.get('show_powerdown_modal'),
            show_change_account_modal: state.user.get('show_change_account_modal'),
            show_add_account_modal: state.user.get('show_add_account_modal'),
            show_app_download_modal: state.user.get('show_app_download_modal'),
            notifications: state.app.get('notifications'),
            show_open_orders_modal: state.user.get('show_open_orders_modal'),
        }
    },
    dispatch => ({
        hideLogin: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideLogin())
        },
        hideConfirm: e => {
            if (e) e.preventDefault();
            dispatch(tr.actions.hideConfirm())
        },
        hideTransfer: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideTransfer())
        },
        hideConvertAssets: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideConvertAssets())
        },
        hidePowerCalc: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hidePowerCalc())
        },
        hidePowerdown: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hidePowerdown());
        },
        hideChangeAccount: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideChangeAccount())
        },
        hideAddAccount: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideAddAccount())
        },
        hideAppDownload: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideAppDownload())
        },
        // example: addNotification: ({key, message}) => dispatch({type: 'ADD_NOTIFICATION', payload: {key, message}}),
        removeNotification: (key) => dispatch({type: 'REMOVE_NOTIFICATION', payload: {key}}),
        
        hideOpenOrders: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideOpenOrders())
        },
    })
)(Modals)
