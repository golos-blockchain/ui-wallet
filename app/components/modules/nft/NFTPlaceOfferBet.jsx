import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { api } from 'golos-lib-js'
import { validateAccountName, Asset, AssetEditor } from 'golos-lib-js/lib/utils'

import AssetBalance from 'app/components/elements/AssetBalance'
import AmountField from 'app/components/elements/forms/AmountField'
import Callout from 'app/components/elements/Callout'
import AmountAssetField from 'app/components/elements/forms/AmountAssetField'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import transaction from 'app/redux/Transaction'
import { generateOrderID } from 'app/utils/market/utils'
import session from 'app/utils/session'

class NFTPlaceOfferBet extends Component {
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
            let currentBalance, price
            const username = session.load().currentName
            if (username) {
                if (this.isBet()) {
                    const { minPrice } = this.props
                    const { symbol } = minPrice
                    let bals = await api.getAccountsBalances([username], { symbols: [symbol] })
                    bals = bals[0]
                    let supply
                    if (bals[symbol]) {
                        supply = Asset(bals[symbol].balance)
                    } else {
                        supply = minPrice.clone()
                        supply.amount = '0'
                    }
                    assets[symbol] = { supply }
                    currentBalance = supply.clone()
                } else {
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
                price = currentBalance.clone()
                price.amount = '0'
            }
            this.setState({
                assets,
                currentBalance,
                order: {
                    price: AssetEditor(price)
                }
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
        } else {
            const { minPrice } = this.props
            if (minPrice && minPrice.gt(0)) {
                if (price.asset.lt(minPrice)) {
                    errors.price = 'min_price'
                }
            }
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

        const order_id = this.isBet() ? 0 : generateOrderID()
        await this.props.placeBet(token_id, values.price, name, order_id, username, () => {
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

    isBet = () => {
        const { minPrice } = this.props
        return !!minPrice
    }

    balanceClick = (e, setFieldValue) => {
        e.preventDefault()
        const { currentBalance } = this.state
        setFieldValue('price', AssetEditor(currentBalance))
    }

    render() {
        const { assets } = this.state

        if (this.doNotRender || !assets) {
            return <LoadingIndicator type='circle' />
        }

        const { minPrice, onClose, } = this.props

        const token = this.getToken()

        const { json_metadata, image } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        const { errorMessage, submitting, currentBalance, } = this.state

        const title = this.isBet() ? tt('nft_tokens_jsx.place_bet') : tt('nft_tokens_jsx.place_offer')

        return <div className='NFTPlaceOfferBet'>
            <CloseButton onClick={onClose} />
            <h4>{title}</h4>
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
                {minPrice && <Callout>
                    {tt('nft_tokens_jsx.min_price') + '  '}
                    {errors.price === 'min_price' ? <b style={{ color: 'red'}}>{minPrice.floatString}</b> : minPrice.floatString}
                </Callout>}
                <div>
                    {tt('g.price')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <AmountField name='price' autoFocus />
                            <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}>
                                {this.isBet() ? <span style={{paddingLeft: '8px', paddingRight: '8px'}}>
                                {currentBalance.symbol}</span> : <AmountAssetField amountField='price' setFieldValue={setFieldValue} values={values} assets={assets}
                                    onChange={this.onAssetChange}/>}
                            </span>
                        </div>
                        {errors.price && errors.price !== 'min_price' && <div className='error'>{errors.price}</div>}
                    </div>
                </div>
                {currentBalance && <AssetBalance balanceValue={currentBalance.floatString} onClick={e => this.balanceClick(e, setFieldValue)} />}
                {(errorMessage && errorMessage !== 'Canceled') ? <div className='row'>
                    <div className='column small-12'>
                        <div className='error' style={{marginBottom:'0px'}}>{errorMessage}</div>
                    </div>
                </div> : null}
                <div className='row' style={{ marginTop: '0.5rem' }}>
                    <div className='column small-9'>
                        <button type='submit' disabled={!isValid || submitting} className='button'>
                            {title}
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
            token_id, price, collectionName, order_id, username, successCallback, errorCallback
        ) => {
            const operation = {
                buyer: username,
                name: collectionName,
                token_id,
                order_id,
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
)(NFTPlaceOfferBet)
