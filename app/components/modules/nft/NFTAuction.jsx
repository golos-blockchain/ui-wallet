import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { api } from 'golos-lib-js'
import { validateAccountName, Asset, AssetEditor } from 'golos-lib-js/lib/utils'

import Callout from 'app/components/elements/Callout'
import AmountField from 'app/components/elements/forms/AmountField'
import AmountAssetField from 'app/components/elements/forms/AmountAssetField'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import transaction from 'app/redux/Transaction'

const isDev = () => {
    return process.env.NODE_ENV === 'development'
}

class NFTAuction extends Component {
    state = {
        auction: {
            min_price: AssetEditor('0.000 GOLOS'),
            expiration: isDev() ? 15 : 7
        }
    }

    async componentDidMount() {
        const isHidden = (sym) => {
            return ($STM_Config.hidden_assets && $STM_Config.hidden_assets[sym])
        }
        try {
            let assets = {}
            const assetsSys = {}
            const data = await api.getAssetsAsync('', [], '', 5000, 'by_symbol_name', { system: true })
            for (const asset of data) {
                asset.supply = Asset(asset.supply)
                const symbol = asset.supply.symbol
                if (symbol === 'GOLOS' || symbol === 'GBG') {
                    assetsSys[symbol] = asset
                } else {
                    assets[symbol] = asset
                }
            }
            assets = { ...assetsSys, ...assets }
            this.setState({
                assets
            })
        } catch (err) {
            console.error(err)
        }
    }

    validate = (values) => {
        const errors = {}
        const { min_price } = values
        if (min_price.asset.eq(0)) {
            errors.min_price = tt('nft_token_sell_jsx.fill_price')
        }
        return errors
    }

    setSubmitting = (submitting) => {
        this.setState({ submitting })
    }

    getToken = () => {
        const { nft_tokens, tokenIdx } = this.props
        if (tokenIdx !== undefined) {
            return nft_tokens.toJS().data[tokenIdx]
        }
        return this.props.token
    }

    _onSubmit = async (values) => {
        this.setSubmitting(true)
        this.setState({
            errorMessage: ''
        })

        const { currentUser, onClose, } = this.props
        const token = this.getToken()
        const { token_id } = token

        const username = currentUser.get('username')

        let expirationSec = parseInt(values.expiration)
        if (!isDev()) {
            expirationSec *= 3600*24
        }
        let gprops
        try {
            gprops = await api.getDynamicGlobalPropertiesAsync()
        } catch (err) {
            console.error(err)
            alert('Error - blockchain unavailable')
            return
        }
        let expiration = new Date(gprops.time + 'Z')
        expiration.setSeconds(expiration.getSeconds() + expirationSec)

        await this.props.auction(token_id, values.min_price.asset, expiration, username, () => {
            this.props.onClose()
            this.setSubmitting(false)
            this.doNotRender = true
            this.props.refetch()
        }, (err) => {
            console.error(err)
            this.setSubmitting(false)
            this.setState({
                errorMessage: err.toString()
            })
        })
    }

    onCancelMouseDown = (e) => {
        e.preventDefault()
        this.setState({
            cancelMouseDown: true
        })
    }

    onCancelMouseUp = (e) => {
        e.preventDefault()
        if (this.state.cancelMouseDown) {
            this.props.onClose()
            this.setState({
                cancelMouseDown: false
            })
        }
    }

    onMouseUp = (e) => {
        if (this.state.cancelMouseDown) {
            this.props.onClose()   
        }
    }

    onAssetChange = (e, asset) => {
        this.setState({
            currentBalance: asset.supply.clone()
        })
    }

    _renderSubmittingIndicator = () => {
        const { submitting } = this.state

        return submitting ? <span className='submitter'>
            <LoadingIndicator type='circle' />
        </span> : null
    }

    render() {
        const { assets } = this.state

        if (this.doNotRender || !assets) {
            return <LoadingIndicator type='circle' />
        }

        const { onClose, } = this.props

        const token = this.getToken()

        const { json_metadata, image, has_offers } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        const { errorMessage, submitting, currentBalance, } = this.state

        return <div className='NFTAuction'>
            <CloseButton onClick={onClose} />
            <h4>{tt('nft_tokens_jsx.start_auction')}</h4>
            <div style={{ marginBottom: '0.5rem' }}>
                <NFTSmallIcon image={image} />
                <span style={{ display: 'inline-block', marginTop: '13px', marginLeft: '0.5rem' }}>{data.title}</span>
            </div>
            <Formik
                initialValues={this.state.auction}
                enableReinitialize={true}
                validate={this.validate}
                validateOnMount={true}
                onSubmit={this._onSubmit}
            >
            {({
                handleSubmit, isValid, values, errors, touched, setFieldValue, handleChange,
            }) => {
                return (
            <Form onMouseUp={this.onMouseUp}>
                <div>
                    {tt('nft_tokens_jsx.min_price')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <AmountField name='min_price' autoFocus />
                            <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}>
                                <AmountAssetField amountField='min_price' setFieldValue={setFieldValue} values={values} assets={assets}
                                    onChange={this.onAssetChange}/>
                            </span>
                        </div>
                        {errors.min_price && <div className='error'>{errors.min_price}</div>}
                    </div>
                </div>
                <div>
                    {tt('nft_tokens_jsx.auction_expiration')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field type='number' name='expiration' />
                            <span className="input-group-label">
                                {isDev() ? tt('nft_tokens_jsx.auction_expiration_dev') : tt('nft_tokens_jsx.auction_expiration2')}
                            </span>
                        </div>
                        {errors.expiration && <div className='error'>{errors.expiration}</div>}
                    </div>
                </div>
                {(errorMessage && errorMessage !== 'Canceled') ? <div className='row'>
                    <div className='column small-12'>
                        <div className='error' style={{marginBottom:'0px'}}>{errorMessage}</div>
                    </div>
                </div> : null}
                {has_offers && <Callout>{tt('nft_tokens_jsx.auction_hint')}</Callout>}
                <div className='row' style={{ marginTop: '0.5rem' }}>
                    <div className='column small-8'>
                        <button type='submit' disabled={!isValid || submitting} className='button'>
                            {tt('nft_tokens_jsx.start')}
                        </button>
                        <button type='button' disabled={submitting} className='button hollow'
                                onMouseDown={this.onCancelMouseDown} onMouseUp={this.onCancelMouseUp}>
                            {tt('g.cancel')}
                        </button>
                        {this._renderSubmittingIndicator()}
                    </div>
                </div>
            </Form>
            )}}</Formik>
        </div>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        return { ...ownProps,
            nft_tokens: state.global.get('nft_tokens'),
        }
    },

    dispatch => ({
        auction: (
            token_id, min_price, expiration, username, successCallback, errorCallback
        ) => {
            const operation = {
                owner: username,
                token_id,
                min_price: min_price.toString(),
                expiration: expiration.toISOString().split('.')[0]
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_auction',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(NFTAuction)
