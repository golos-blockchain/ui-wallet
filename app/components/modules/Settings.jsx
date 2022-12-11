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

    constructor(props) {
        super()
        this.initForm(props)
    }

    initForm(props) {
        const cover_image = props.profile.cover_image_wallet || ''
        reactForm({
            instance: this,
            name: 'accountSettings',
            fields: ['cover_image'],
            initialValues: { cover_image },
            validation: values => ({
                cover_image: values.cover_image && !/^https?:\/\//.test(values.cover_image) ? tt('settings_jsx.invalid_url') : null,
            })
        })
        this.handleSubmitForm =
            this.state.accountSettings.handleSubmit(args => this.handleSubmit(args))
    }

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

    onDropCover = (acceptedFiles, rejectedFiles) => {
        if (!acceptedFiles.length) {
            if (rejectedFiles.length) {
                this.setState({progress: {error: tt('reply_editor.please_insert_only_image_files')}})
                console.log('onDrop Rejected files: ', rejectedFiles)
            }
            return
        }
        const file = acceptedFiles[0]
        this.uploadCover(file, file.name)
    }

    uploadCover = (file, name = '') => {
        const {notify} = this.props
        const {uploadImage} = this.props
        this.setState({cImageUploading: true})
        uploadImage(file, progress => {
            if (progress.url) {
                const {cover_image: {props: {onChange}}} = this.state
                onChange(progress.url)
            }
            if (progress.error) {
                const { error } = progress;
                notify(error, 10000)
            }
            this.setState({ cImageUploading: false })
        })
    }

    onOpenCoverClick = () => {
        this.dropzoneCover.open();
    }

    handleSubmit = ({updateInitialValues}) => {
        let {metaData} = this.props
        if (!metaData) metaData = {}

        if (typeof metaData === 'string' && metaData.localeCompare("{created_at: 'GENESIS'}") == 0) {
            metaData = {}
            metaData.created_at = 'GENESIS'
        }

        if(!metaData.profile) metaData.profile = {}
        delete metaData.user_image; // old field... cleanup

        const { cover_image } = this.state

        metaData.profile.cover_image_wallet = cover_image.value

        // Remove empty keys
        if (!metaData.profile.cover_image_wallet) delete metaData.profile.cover_image_wallet

        const {account, updateAccount} = this.props
        this.setState({loading: true})
        updateAccount({
            json_metadata: JSON.stringify(metaData),
            account: account.name,
            memo_key: account.memo_key,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('updateAccount ERROR', e)
                    this.setState({
                        loading: false,
                        changed: false,
                        errorMessage: tt('g.server_returned_error')
                    })
                }
            },
            successCallback: () => {
                this.setState({
                    loading: false,
                    changed: false,
                    errorMessage: '',
                    successMessage: tt('g.saved') + '!',
                })
                // remove successMessage after a while
                setTimeout(() => this.setState({successMessage: ''}), 4000)
                updateInitialValues()
            }
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

        const { cover_image, cImageUploading } = this.state

        const selectorStyleCover = cImageUploading ?
            {
                whiteSpace: `nowrap`,
                display: `flex`,
                alignItems: `center`,
                padding: `0 6px`,
                pointerEvents: `none`,
                cursor: `default`,
                opacity: `0.6`
            } :
            {
                display: `flex`,
                alignItems: `center`,
                padding: `0 6px`
            }

        return <div className="Settings">

            <div className="row">
                <form onSubmit={this.handleSubmitForm} className="small-12 medium-8 large-6 columns">
                    <h3>{tt('settings_jsx.public_profile_settings')}</h3>
                    <label>
                    {tt('settings_jsx.cover_image_url')}
                    <div style={{display: `flex`, alignItems: `stretch`, alignContent: `stretch`}}>
                      <Dropzone style={{width: `100%`}}
                                onDrop={this.onDropCover}
                                className={'none'}
                                disableClick multiple={false} accept="image/*"
                                ref={(node) => { this.dropzoneCover = node; }}>
                        <input ref={(r) => this.pCoverImageUrlInput = r}
                               type="url" {...cover_image.props}
                               autoComplete="off"
                               disabled={cImageUploading}
                        />
                      </Dropzone>
                      <a onClick={this.onOpenCoverClick}
                         style={selectorStyleCover}>
                        {cImageUploading ? `${tt(`user_saga_js.image_upload.uploading`)} ...` : tt(`g.upload`)}
                      </a>
                    </div>
                  </label>
                    <br />
                    {state.loading && <span><LoadingIndicator type="circle" /><br /></span>}
                    {!state.loading && <input type="submit" className="button" value={tt('settings_jsx.update')} disabled={disabled} />}
                    {' '}{
                            state.errorMessage
                                ? <small className="error">{state.errorMessage}</small>
                                : state.successMessage
                                ? <small className="success uppercase">{state.successMessage}</small>
                                : null
                        }
                </form>
            </div>
            
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
        uploadImage: (file, progress) => {
            dispatch({
                type: 'user/UPLOAD_IMAGE',
                payload: {file, progress},
            })
        },
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