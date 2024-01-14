import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { api } from 'golos-lib-js'
import { validateAccountName, Asset, AssetEditor } from 'golos-lib-js/lib/utils'

import AssetBalance from 'app/components/elements/AssetBalance'
import AmountField from 'app/components/elements/forms/AmountField'
import AmountAssetField from 'app/components/elements/forms/AmountAssetField'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import transaction from 'app/redux/Transaction'
import { generateOrderID } from 'app/utils/market/utils'
import session from 'app/utils/session'

class NFTPlaceBet extends Component {
    state = {
        order: {
            price: AssetEditor('0.000 GOLOS')
        }
    }

    async componentDidMount() {
        const isHidden = (sym) => {
            return ($STM_Config.hidden_assets && $STM_Config.hidden_assets[sym])
        }
        try {
            let assets = {}
            let currentBalance
            const username = session.load().currentName
            if (username) {
                let bals = await api.getAccountsBalances([username], { system: true })
                bals = bals[0]
                if (bals['GOLOS']) {
                    assets['GOLOS'] = { supply: Asset(bals['GOLOS'].balance) }
                }
                if (bals['GBG']) {
                    assets['GBG'] = { supply: Asset(bals['GBG'].balance) }
                }
                for (const [sym, obj] of Object.entries(bals)) {
                    if (!isHidden(sym) && sym !== 'GOLOS' && sym !== 'GBG') {
                        assets[sym] = { supply: Asset(obj.balance) }
                    }
                }
                for (const [sym, obj] of Object.entries(assets)) {
                    currentBalance = obj.supply.clone()
                    break
                }
            }
            this.setState({
                assets,
                currentBalance
            })
        } catch (err) {
            console.error(err)
        }
    }

    validate = (values) => {
        const errors = {}
        const { price } = values
        const { currentBalance } = this.state
        if (price.asset.eq(0)) {
            errors.price = tt('nft_token_sell_jsx.fill_price')
        } else if (currentBalance && price.asset.gt(currentBalance)) {
            errors.price = tt('g.invalid_amount')
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
        const { token_id, name } = token

        const username = currentUser.get('username')

        await this.props.placeBet(token_id, values.price, name, username, () => {
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
        e.preventDefault()
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

        const { json_metadata, image } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        const { errorMessage, submitting, currentBalance, } = this.state

        return <div className='NFTPlaceBet'>
            <CloseButton onClick={onClose} />
            <h4>{tt('nft_tokens_jsx.place_bet')}</h4>
            <div style={{ marginBottom: '0.5rem' }}>
                <NFTSmallIcon image={image} />
                <span style={{ display: 'inline-block', marginTop: '13px', marginLeft: '0.5rem' }}>{data.title}</span>
            </div>
            <Formik
                initialValues={this.state.order}
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
                    {tt('g.price')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <AmountField name='price' autoFocus />
                            <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}>
                                <AmountAssetField amountField='price' setFieldValue={setFieldValue} values={values} assets={assets}
                                    onChange={this.onAssetChange}/>
                            </span>
                        </div>
                        {errors.price && <div className='error'>{errors.price}</div>}
                    </div>
                </div>
                {currentBalance && <AssetBalance balanceValue={currentBalance.floatString} />}
                {(errorMessage && errorMessage !== 'Canceled') ? <div className='row'>
                    <div className='column small-12'>
                        <div className='error' style={{marginBottom:'0px'}}>{errorMessage}</div>
                    </div>
                </div> : null}
                <div className='row' style={{ marginTop: '0.5rem' }}>
                    <div className='column small-8'>
                        <button type='submit' disabled={!isValid || submitting} className='button'>
                            {tt('nft_tokens_jsx.place_bet')}
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
        placeBet: (
            token_id, price, collectionName, username, successCallback, errorCallback
        ) => {
            const operation = {
                buyer: username,
                name: collectionName,
                token_id,
                order_id: generateOrderID(),
                price: price.asset.toString()
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_buy',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(NFTPlaceBet)
