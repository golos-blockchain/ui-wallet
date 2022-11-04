import React from 'react';
import {connect} from 'react-redux'
import user from 'app/redux/User';
import g from 'app/redux/GlobalReducer';
import tt from 'counterpart';
import throttle from 'lodash/throttle'
import transaction from 'app/redux/Transaction'
import { getMetadataReliably } from 'app/utils/NormalizeProfile';
import Icon from 'app/components/elements/Icon';
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import Userpic from 'app/components/elements/Userpic';
import reactForm from 'app/utils/ReactForm'
import {fromJS, Set, Map} from 'immutable'
import cookie from "react-cookie";
import Dropzone from 'react-dropzone'
import { LANGUAGES, DEFAULT_LANGUAGE, LOCALE_COOKIE_KEY, USER_GENDER } from 'app/client_config'

class Settings extends React.Component {

    UNSAFE_componentWillMount() {
        const {accountname} = this.props
        const {vesting_shares} = this.props.account
        
        let notifyPresets;

        if (process.env.BROWSER){
            notifyPresets = localStorage.getItem('notify.presets-' + accountname)
            if (notifyPresets) notifyPresets = JSON.parse(notifyPresets)
            if (notifyPresets && notifyPresets.fill_order === undefined) {
                notifyPresets.fill_order = true;
            }
        }
        if (!notifyPresets) notifyPresets = {
            receive: true, donate: true, comment_reply: true, mention: true, message: true, fill_order: true,
        }
        this.setState({notifyPresets})
    }

    notify = () => {
        this.props.notify(tt('g.saved'))
    }

    notifyThrottled = throttle(this.notify, 2000)

    unmuteAsset = (e) => {
        const sym = e.currentTarget.dataset.sym;
        let mutedUIA = [];
        mutedUIA = localStorage.getItem('mutedUIA');
        if (mutedUIA) try { mutedUIA = JSON.parse(mutedUIA) } catch (ex) {}
        if (!mutedUIA) mutedUIA = [];
        mutedUIA = mutedUIA.filter(o => o !== sym)
        localStorage.setItem('mutedUIA', JSON.stringify(mutedUIA));
        window.location.reload()
    }

    onNotifyPresetChange = e => {
        let notifyPresets = {...this.state.notifyPresets};
        notifyPresets[e.target.dataset.type] = e.target.checked;
        this.setState({
            notifyPresets,
            notifyPresetsTouched: true,
        });
    }

    onNotifyPresetsSubmit = e => {
        const { accountname } = this.props;
        localStorage.setItem('notify.presets-' + accountname,
            JSON.stringify(this.state.notifyPresets));
        this.setState({
            notifyPresetsTouched: false,
        })
    }

    render() {
        const {state, props} = this
        
        const disabled = !props.isOwnAccount || state.loading

        const {notifyPresets, notifyPresetsTouched} = this.state

        const {account, isOwnAccount} = this.props
        let mutedUIA = [];
        if (process.env.BROWSER) {
          mutedUIA = localStorage.getItem('mutedUIA');
          if (mutedUIA) try { mutedUIA = JSON.parse(mutedUIA) } catch (ex) {}
          if (!mutedUIA) mutedUIA = [];
        }
        let mutedUIAlist = [];
        for (let sym of mutedUIA) {
          mutedUIAlist.push(<p key={sym}>{sym}&nbsp;<a data-sym={sym} onClick={this.unmuteAsset}>X</a></p>)
        }

        return <div className="Settings">
            
            {mutedUIA && mutedUIA.length > 0 &&
                <div className="row">
                    <div className="small-12 columns">
                        <br /><br />
                        <h3>{tt('settings_jsx.muted_uia')}</h3>
                        {mutedUIAlist}
                    </div>
                </div>}

            {isOwnAccount &&
                <div className="row">
                    <div className="small-12 medium-8 large-6 columns Notification_presets">
                        <br /><br />
                        <h3>{tt('settings_jsx.notifications_settings')}</h3>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.receive} data-type='receive' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/transfer' size='2x' />
                            <span>{tt('settings_jsx.notifications_transfer')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.donate} data-type='donate' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/donate' size='2x' />
                            <span>{tt('settings_jsx.notifications_donate')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.comment_reply} data-type='comment_reply' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/comment' size='2x' />
                            <span>{tt('settings_jsx.notifications_reply')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.mention} data-type='mention' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/mention' size='2x' />
                            <span>{tt('settings_jsx.notifications_mention')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.message} data-type='message' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/message' size='2x' />
                            <span>{tt('settings_jsx.notifications_message')}</span>
                        </label>
                        <label>
                            <input type='checkbox' checked={!!notifyPresets.fill_order} data-type='fill_order' onChange={this.onNotifyPresetChange} />
                            <Icon name='notification/order' size='2x' />
                            <span>{tt('settings_jsx.notifications_order')}</span>
                        </label>
                        <br />
                        <input
                            type="submit"
                            onClick={this.onNotifyPresetsSubmit}
                            className="button"
                            value={tt('settings_jsx.update')}
                            disabled={!this.state.notifyPresetsTouched}
                        />
                    </div>
                </div>}            

        </div>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {accountname} = ownProps.routeParams
        const account = state.global.getIn(['accounts', accountname]).toJS()
        const current_user = state.user.get('current')
        const username = current_user ? current_user.get('username') : ''
        let metaData = account ? getMetadataReliably(account.json_metadata) : {}
        const profile = metaData && metaData.profile ? metaData.profile : {}

        return {
            account,
            metaData,
            accountname,
            isOwnAccount: username == accountname,
            profile,
            ...ownProps
        }
    },
    // mapDispatchToProps
    dispatch => ({
        updateAccount: ({successCallback, errorCallback, ...operation}) => {
            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            const options = {type: 'account_metadata', operation, successCallback: success, errorCallback}
            dispatch(transaction.actions.broadcastOperation(options))
        },
        notify: (message, dismiss = 3000) => {
            dispatch({type: 'ADD_NOTIFICATION', payload: {
                key: "settings_" + Date.now(),
                message,
                dismissAfter: dismiss}
            });
        }
    })
)(Settings)