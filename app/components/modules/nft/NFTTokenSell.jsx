import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Asset, AssetEditor } from 'golos-lib-js/lib/utils'

import AmountField from 'app/components/elements/forms/AmountField'
import AmountAssetField from 'app/components/elements/forms/AmountAssetField'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import transaction from 'app/redux/Transaction'
import { generateOrderID } from 'app/utils/market/utils'

class NFTTokenSell extends Component {
    state = {
        order: {
            price: AssetEditor('0.000 GOLOS')
        }
    }

    validate = (values) => {
        const errors = {}
        const { price } = values
        if (values.price.asset.eq(0)) {
            errors.price = tt('nft_token_sell_jsx.fill_price')
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

        await this.props.sellToken(token_id, values.price, currentUser, () => {
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

    _renderSubmittingIndicator = () => {
        const { submitting } = this.state

        return submitting ? <span className='submitter'>
            <LoadingIndicator type='circle' />
        </span> : null
    }

    render() {
        if (this.doNotRender) {
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

        const { errorMessage, submitting  } = this.state

        const assets = {}
        assets['GOLOS'] = { supply: Asset(0, 3, 'GOLOS') }
        assets['GBG'] = { supply: Asset(0, 3, 'GBG') }
        for (const asset of this.props.assets) {
            asset.supply = asset.supply.symbol ? asset.supply : Asset(asset.supply)
            assets[asset.supply.symbol] = asset
        }

        return <div className='NFTTokenSell'>
            <CloseButton onClick={onClose} />
            <h4>{tt('g.sell')}</h4>
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
                                <AmountAssetField amountField='price' setFieldValue={setFieldValue} values={values} assets={assets} />
                            </span>
                        </div>
                        <ErrorMessage name='price' component='div' className='error' />
                    </div>
                </div>
                {(errorMessage && errorMessage !== 'Canceled') ? <div className='row'>
                    <div className='column small-12'>
                        <div className='error' style={{marginBottom:'0px'}}>{errorMessage}</div>
                    </div>
                </div> : null}
                <div className='row' style={{ marginTop: '0.5rem' }}>
                    <div className='column small-8'>
                        <button type='submit' disabled={!isValid || submitting} className='button'>
                            {tt('g.sell')}
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
            assets: state.global.get('assets')
        }
    },

    dispatch => ({
        sellToken: (
            token_id, price, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            const operation = {
                seller: username,
                token_id,
                buyer: '',
                order_id: generateOrderID(),
                price: price.asset.toString()
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_sell',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(NFTTokenSell)
