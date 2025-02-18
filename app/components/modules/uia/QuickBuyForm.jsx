import React from 'react'
import cn from 'classnames'
import tt from 'counterpart'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Asset, AssetEditor } from 'golos-lib-js/lib/utils'

import RadioButton from 'app/components/elements/common/RadioButton'
import AmountField from 'app/components/elements/forms/AmountField'
import Icon from 'app/components/elements/Icon'
import { ExchangeTypes } from 'shared/getExchangeData'
import { getExchange, ExchangeErrors } from 'app/utils/market/exchange'
import { subtractDepoFee, includeDepoFee } from 'app/utils/UIA'

// see GOOD_MAX_DEPO_FEE percent in app/utils/UIA.js

class QuickBuyForm extends React.Component {
    state = {
    }

    componentDidMount() {
        this.load()
    }

    componentDidUpdate(prevProps) {
        if (this.props.sellSym !== prevProps.sellSym) {
            this.load()
        }
    }

    load = () => {
        const { assets, buySym, sellSym } = this.props
        if (!assets || !buySym) return
        const buy = assets[buySym]
        const sell = assets[sellSym]
        if (!buy || !sell) return

        const sellAmount = Asset(0, sell.precision, sellSym)
        const minSell = sellAmount.clone()
        const { deposit } = sell
        if (deposit.min_amount) {
            minSell.amountFloat = deposit.min_amount.toString()
        }
        this.setState({
            form: {
                buyAmount: AssetEditor(0, buy.precision, buySym),
                sellAmount: AssetEditor(sellAmount),
            },
            minSell,
            sell,
            buy,
        })
    }

    validate = (values) => {
        const { minSell, clearSell } = this.state
        let errors = {}
        if (minSell && values.sellAmount.asset.lt(minSell)) {
            errors.sellAmount = 'too_low_sell'
        } else if (clearSell && clearSell.lte(0)) {
            errors.sellAmount = 'too_big_fee'
        }
        return errors
    }

    _onExchangeData = (data, isBuy) => {
        const { altBanner, warning } = data
        const { sell, buy } = altBanner
        let resBetter
        if (isBuy && sell) {
            resBetter = sell
        } else if (!isBuy && buy) {
            resBetter = buy
        }
        this.setState({
            warning
        })
        return { resBetter }
    }

    buyAmountUpdated = async (buyAsset, { values, applyFieldValue }) => {
        const { sellAmount } = values
        let resBetter
        let res = await getExchange(sellAmount.asset, buyAsset, null, (data) => {
            const extra = this._onExchangeData(data, true)
            if (extra.resBetter) resBetter = extra.resBetter
        }, () => {

        }, ExchangeTypes.direct, false)

        if (resBetter) res = resBetter

        const { deposit } = this.state.sell
        let { fullSell, fee, warnFee } = includeDepoFee(res, deposit)
        this.setState({
            clearSell: res,
            sellFee: fee,
            warnSellFee: warnFee,
            isSell: false,
        })

        applyFieldValue('sellAmount', AssetEditor(fullSell))
    }

    sellAmountUpdated = async (sellAsset, { values, applyFieldValue }) => {
        const { deposit } = this.state.sell
        let { clearSell, fee, warnFee } = subtractDepoFee(sellAsset, deposit)

        this.setState({
            clearSell,
            sellFee: fee,
            warnSellFee: warnFee,
            isSell: true,
        })

        if (clearSell.lte(0)) {
            return
        }

        const { buyAmount } = values
        let resBetter
        let res = await getExchange(clearSell, buyAmount.asset, null, (data) => {
            const extra = this._onExchangeData(data, false)
            if (extra.resBetter) resBetter = extra.resBetter
        }, () => {

        }, ExchangeTypes.direct)

        if (resBetter) res = resBetter

        applyFieldValue('buyAmount', AssetEditor(res))
    }

    _onSubmit = async (values) => {
        const { clearSell } = this.state
        const { onContinue } = this.props
        if (onContinue) {
            onContinue({ waitingAmount: clearSell })
        }
    }

    _renderBuyError = (values, touched, errors) => {
        const { isSell, warning } = this.state

        return <div className='sell-error'>
            {(!isSell && warning && values.buyAmount.asset.gt(0)) ? 
                <div><div className='error'>{tt('quick_buy_form_jsx.try_another_amount')}</div></div> : null}
        </div>
    }

    _renderSellError = (values, touched, errors) => {
        const { minSell, sellFee, warnSellFee, isSell, warning } = this.state

        return <div className='sell-error'>
            {(minSell && minSell.gt(0)) ? <div className={cn('min-amount', {
                'has-error': (touched.sellAmount && errors.sellAmount === 'too_low_sell')
            })}>
                <b>{tt('asset_edit_withdrawal_jsx.min_amount') + minSell.floatString}</b>
            </div> : null}
            {(errors.sellAmount === 'too_big_fee' || warnSellFee) ?
                <div className='error'>
                    {tt('quick_buy_form_jsx.too_big_fee')}<b>{sellFee.floatString}</b>{'!'}
                    <Icon name='info_o' title={tt('quick_buy_form_jsx.fee_scam')} />
                </div> : null}
            {(isSell && warning && values.sellAmount.asset.gt(0)) ? 
                <div className='error'>{tt('quick_buy_form_jsx.try_another_amount')}</div> : null}
        </div>
    }

    render() {
        const { form, } = this.state
        if (!form) {
            return null
        }
        const { buySym, sellSym } = this.props
        return <div className='QuickBuyForm'>
            <Formik
                initialValues={this.state.form}
                enableReinitialize={true}
                validate={this.validate}
                validateOnMount={true}
                onSubmit={this._onSubmit}
            >
            {({
                handleSubmit, isValid, values, errors, isTouched, touched, setFieldValue, handleChange,
                applyFieldValue,
            }) => {
                const disabled = !isValid || values.buyAmount.asset.eq(0) || values.sellAmount.asset.eq(0)
                    || this.state.warning
                return (
            <Form>
                <div className='row'>
                    <div className='column small-6'>
                        <div>{tt('quick_buy_form_jsx.buy')}</div>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <AmountField name='buyAmount' autoFocus
                                onChange={this.buyAmountUpdated} />
                            <span className="input-group-label">
                                {buySym}
                            </span>
                        </div>
                    </div>
                    <div className='column small-6'>
                        <div>{tt('quick_buy_form_jsx.sell')}</div>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <AmountField name='sellAmount'
                                onChange={this.sellAmountUpdated} />
                            <span className="input-group-label">
                                {sellSym.startsWith('YM') ? sellSym.substring(2) : sellSym}
                            </span>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '0.5rem' }}>
                    <div className='column small-6'>
                        {this._renderBuyError(values, touched, errors)}
                    </div>
                    <div className='column small-6'>
                        {this._renderSellError(values, touched, errors)}
                    </div>
                </div>
                <div className='row' style={{ marginTop: '1rem' }}>
                    <div className='column small-12'>
                        <center>
                            <button type='submit' disabled={disabled} className='button'>
                                {tt('g.continue')}
                            </button>
                        </center>
                    </div>
                </div>
            </Form>
            )}}</Formik>
        </div>
    }
}

export default QuickBuyForm
