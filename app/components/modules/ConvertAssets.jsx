import React from 'react'
import PropTypes from 'prop-types'
import golos, { api, libs } from 'golos-lib-js'
import { Asset, AssetEditor, Price } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import { Map, } from 'immutable'
import { Link, browserHistory } from 'react-router'

import AssetBalance from 'app/components/elements/AssetBalance'
import RadioButton from 'app/components/elements/common/RadioButton'
import CMCValue from 'app/components/elements/market/CMCValue'
import FinishedOrder from 'app/components/elements/market/FinishedOrder'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import MarketPair from 'app/components/elements/market/MarketPair'
import { normalizeAssets, DEFAULT_EXPIRE, generateOrderID,
        calcFeeForSell, calcFeeForBuy } from 'app/utils/market/utils'
import { ExchangeTypes, getExchange } from 'app/utils/market/exchange'
import transaction from 'app/redux/Transaction'

class ConvertAssets extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: true,
            myBalance: Asset(0, 3, 'GOLOS'),
            sellAmount: AssetEditor(0, 3, 'GOLOS'),
            sellError: '',
            buyAmount: AssetEditor(0, 3, 'GBG'), // not includes fee
            fee: Asset(0, 3, 'GBG'),
            exType: ExchangeTypes.direct,
            warning: '',
            cmcPrice: {}
        }
    }

    sellSym = () => this.state.sellAmount.asset.symbol
    buySym = () => this.state.buyAmount.asset.symbol

    async componentDidMount() {
        let assetsRaw
        try {
            assetsRaw = await api.getAssetsAsync('', [], '', 5000, 'by_marketed')
        } catch (err) {
            console.error(err)
            return
        }
        let assets = {}
        for (const i in assetsRaw) {
            const asset = assetsRaw[i]
            assets[asset.supply.split(" ")[1]] = asset
        }
        let assetsNorm = normalizeAssets(assets)
        this.setState({
            loading: false,
            assets: assetsNorm
        })
    }

    getBalance = async (sym1, asset1) => {
        const { currentAccount } = this.props
        let myBalance = this.state.myBalance
        if (sym1 === 'GOLOS') {
            myBalance = Asset(currentAccount.get('balance'))
        } else if (sym1 === 'GBG') {
            myBalance = Asset(currentAccount.get('sbd_balance'))
        } else {
            const res = await api.getAccountsBalancesAsync([currentAccount.get('name')])
            myBalance = res[0][sym1] ? Asset(res[0][sym1].balance) : Asset(0, asset1.precision, sym1)
        }
        return myBalance
    }

    onPairChange = async ({ event, link, sym1, asset1, sym2, asset2 }) => {
        if (event) {
            event.preventDefault()
            if (!this.props.isDialog) {
                browserHistory.push(link)
                return
            }
        }
        /*if (this.state.canceled) {
            this.setState({ canceled: false })
            return
        }*/
        let buyAmount = Asset(0, asset2.precision, sym2)
        const myBalance = await this.getBalance(sym1, asset1)

        let sellAmount = myBalance.clone()

        const { exType } = this.state
        let fee
        let res = await getExchange(sellAmount, buyAmount, myBalance,
            (data) => {
                fee = data.fee
                const { warning, altBanner } = data
                this.setState({
                    warning,
                    altBanner
                })
            }, exType)
        if (res && !fee) {
            let calc = calcFeeForSell(res, this.state.assets[sym2].fee_percent)
            res = calc.clearBuy
            fee = calc.fee
        }

        this.setState({
            myBalance,
            sellAmount: AssetEditor(sellAmount),
            sellError: '',
            buyAmount: AssetEditor(res || buyAmount),
            fee,
        })
    }

    sellAmountUpdated = async () => {
        const { sellAmount, buyAmount, myBalance, assets, exType } = this.state
        let fee
        let res = await getExchange(sellAmount.asset, buyAmount.asset, myBalance,
            (data) => {
                fee = data.fee
                const { warning, altBanner } = data
                this.setState({ warning, altBanner })
            }, exType)
        if (res) {
            if (!fee) {
                let calc = calcFeeForSell(res, assets[buyAmount.asset.symbol].fee_percent)
                res = calc.clearBuy
                fee = calc.fee
            }
            this.setState({
                buyAmount: AssetEditor(res),
                fee,
            })
        }
    }

    assetBalanceClick = e => {
        e.preventDefault()
        const { myBalance } = this.state
        this.setState({
            sellAmount: AssetEditor(myBalance),
            sellError: ''
        }, () => {
            this.sellAmountUpdated()
        })
    }

    onSellAmountChange = (e) => {
        let newAmount = this.state.sellAmount.withChange(e.target.value)
        if (newAmount.hasChange && newAmount.asset.amount >= 0) {
            let sellError = ''
            if (newAmount.asset.gt(this.state.myBalance)) {
                sellError = tt('transfer_jsx.insufficient_funds')
            }
            this.setState({
                sellAmount: newAmount,
                sellError
            }, () => {
                this.sellAmountUpdated()
            })
        }
    }

    onBuyAmountChange = async (e) => {
        let newAmount = this.state.buyAmount.withChange(e.target.value)
        if (newAmount.hasChange && newAmount.asset.amount >= 0) {
            this.setState({
                buyAmount: newAmount,
            })

            const { sellAmount, myBalance, assets, exType } = this.state

            let fee, warning
            let calc = calcFeeForBuy(newAmount.asset, assets[newAmount.asset.symbol].fee_percent)

            let res = await getExchange(sellAmount.asset, newAmount.asset, myBalance,
            (data) => {
                fee = data.fee
                const { warning, altBanner } = data
                this.setState({ warning, altBanner })
            }, exType, false)
            if (res) {
                this.setState({
                    sellAmount: AssetEditor(res),
                    fee: fee || calc.fee
                })
            }
        }
    }

    submit = async (e) => {
        e.preventDefault()
        const {
            sellAmount: { asset: sellAmount },
            buyAmount: { asset: buyAmount },
            chain
        } = this.state
        let minToReceive
        let confirm
        if (this.limitPrice) {
            minToReceive = sellAmount.mul(this.limitPrice)

            let possible = sellAmount.mul(this.bestPrice)
            if (possible.minus(possible.mul(3000).div(10000)).gt(buyAmount)) {
                confirm = tt('convert_assets_jsx.price_warning')
            }
        } else {
            minToReceive = this.state.buyAmount.asset
        }

        this.setState({ loading: true })

        const onError = (err, tag = '') => {
            console.error(tag, err)
            this.setState({ loading: false, canceled: true })
        }

        const { currentAccount } = this.props

        if (chain) {
            let tx
            try {
                tx = await libs.dex.makeExchangeTx(chain.steps, {
                    owner: currentAccount.get('name')
                })
            } catch (err) {
                alert('makeExchangeTx error:\n' + err.toString() + '\n\n'
                    + tt('convert_error.try_direct') + tt('convert_error.try_direct2') + '.')
                onError(err, 'makeExchangeTx')
                return
            }

            this.props.placeOrders(currentAccount.get('name'), tx, confirm, async (orderid) => {
                await new Promise(resolve => setTimeout(resolve, 4000))
                const newState = { loading: false, finishedAcc: currentAccount.get('name') }
                this.setState({
                    ...newState,
                    finished: 'full',
                })
            }, onError)
            return
        }

        this.props.placeOrder(currentAccount.get('name'),
            sellAmount, minToReceive, confirm, async (orderid) => {
            await new Promise(resolve => setTimeout(resolve, 4000))
            const orders = await api.getOpenOrdersAsync(currentAccount.get('name'),
                [sellAmount.symbol, minToReceive.symbol])
            let found
            for (let order of orders){
                if (order.orderid === orderid) {
                    found = order
                    break
                }
            }
            const newState = { loading: false, finishedAcc: currentAccount.get('name') }
            if (!found) {
                this.setState({
                    ...newState,
                    finished: 'full',
                })
            } else if (found.asset1 === found.sell_price.base && found.asset2 === found.sell_price.quote) {
                this.setState({
                    ...newState,
                    finished: 'not'
                })
            } else {
                this.setState({
                    ...newState,
                    finished: 'partly',
                    remainToReceive: Asset(found.sell_price.base)
                })
            }
        }, onError)
    }

    _renderDescription() {
        const { modal } = this.props
        const { altBanner } = this.state
        const delimiter = modal ? ' ' : <br />
        let width = modal ? ((this.sellSym().length + this.buySym().length) > 11 ? '30%' : '40%') : '50%'
        let lines = []
        let onClick
        if (altBanner) {
            let it = 0
            const { isSell, chain, sell, buy, req } = altBanner

            //width = '50%'

            if (chain) {
                onClick = (e) => {
                    e.preventDefault()
                    this.setState({
                        chain,
                        exType: ExchangeTypes.multi
                    })
                }

                lines.push(<span key={++it}>{tt('convert_alt_banner.using_chain')}</span>)
                lines.push(<br key={++it} />)
                lines.push(<span className='ConvertAssets__link' key={++it}>{chain.syms.join(' > ')}</span>)
                lines.push(<br key={++it} />)
            } else {
                onClick= (e) => {
                    e.preventDefault()
                    this.setState({
                        chain: null,
                        exType: ExchangeTypes.direct
                    })
                }
                lines.push(<span key={++it}>{tt('convert_alt_banner.with')}</span>)
                lines.push(<span className='ConvertAssets__link' key={++it} style={{ marginRight: '0.25rem' }}i>{tt('convert_alt_banner.direct')}</span>)
            }

            if (isSell) {
                lines.push(<span key={++it}>{tt('convert_alt_banner.you_can_receive') + ' '}</span>)
                lines.push(<b key={++it}>{buy.floatString + '.'}</b>)
            } else {
                if (!req || req.eq(buy)) {
                    lines.push(<span key={++it}>{tt('convert_alt_banner.you_spend') + ' '}</span>)
                    lines.push(<b key={++it}>{sell.floatString + '.'}</b>)
                } else {
                    lines.push(<span key={++it}>{tt('convert_alt_banner.you_can_buy')}</span>)
                    lines.push(<br key={++it} />)
                    lines.push(<b key={++it}>{buy.floatString}</b>)
                    lines.push(<span key={++it}>{' ' + tt('convert_alt_banner.for') + ' '}</span>)
                    lines.push(<b key={++it}>{sell.floatString + '.'}</b>)
                }
            }
        } else {
            lines = tt('convert_assets_jsx.description')
                .reduce((prev, curr) => [prev, delimiter, curr])
        }
        return (<span className={'secondary ConvertAssets__description' + (altBanner ? ' clickable' : '')} style={{ width }} onClick={onClick} >
                {lines}
            </span>)
    }

    _renderPrice() {
        const { sellAmount: {asset: sellAmount }, buyAmount: {asset: buyAmount } } = this.state

        if (sellAmount.amount == 0 || buyAmount.amount == 0) {
            return null
        }

        let res = (parseFloat(buyAmount.amountFloat) / parseFloat(sellAmount.amountFloat)).toString()
        const dot = res.indexOf(res)
        if (dot != -1) {
            res = res.substring(0, dot + 9)
        }

        return <div style={{ marginTop: '0.25rem' }}>
                    {tt('convert_assets_jsx.price')} {'1 ' + sellAmount.symbol}:<br/>
                    <b>{' ~' + res + ' ' + buyAmount.symbol}</b>
                </div>
    }

    _renderFields() {
        const { direction } = this.props
        const { myBalance, sellAmount, sellError, buyAmount } = this.state
        const marginTop = '1.25rem'
        const fieldSell = (<React.Fragment>
                <div style={{ marginTop }}>
                    {tt('convert_assets_jsx.sell_amount')}
                    <div className='input-group'>
                        <input type='text' value={sellAmount.amountStr} onChange={this.onSellAmountChange} />
                        <span className='input-group-label uppercase'>{this.sellSym()}</span>
                    </div>
                </div>
                <AssetBalance balanceValue={myBalance.toString()} onClick={this.assetBalanceClick} />
                {sellError ? <div className='error'>{sellError}</div> : null}
                {this._renderPrice()}
            </React.Fragment>)
        const fieldBuy = (<React.Fragment>
                <div style={{ marginTop }}>
                    {tt('convert_assets_jsx.buy_amount')}
                    <div className='input-group'>
                        <input type='text' value={buyAmount.amountStr} onChange={this.onBuyAmountChange} />
                        <span className='input-group-label uppercase'>{this.buySym()}</span>
                    </div>
                </div>
                <CMCValue
                    buyAmount={buyAmount.asset}
                    renderer={cmc => <div>{tt('convert_assets_jsx.coinmarketcap_value')}{cmc}</div>}
                    />
                {this._renderFee()}
            </React.Fragment>)
        return (<div className='row'>
                    <div className='column small-6' style={{ paddingLeft: '0rem' }}>
                        {fieldSell}
                    </div>
                    <div className='column small-6' style={{ paddingRight: '0rem' }}>
                        {fieldBuy}
                    </div>
            </div>)
    }

    _renderFee() {
        const { buyAmount, fee, assets } = this.state
        const { fee_percent } = assets[buyAmount.asset.symbol]

        let feeStr = fee.floatString

        const buyWF = buyAmount.asset.plus(fee)

        return (<div>
                <small style={{ marginTop: '0.25rem' }}>
                    {tt('g.fee') + ': '}
                    <b>{feeStr}</b>
                    {fee_percent > 0 ? <span>{' (' + (fee_percent / 100) + '%)'}</span> : null}
                </small>
                {fee.amount > 0 ? <small style={{ marginTop: '0.25rem' }}><br/>
                    {tt('convert_assets_jsx.amount_with_fee') + ' '}
                    {buyWF.amountFloat}
                </small> : null}
            </div>)
    }

    _renderWarning() {
        const { warning } = this.state
        if (!warning) {
            return null
        }
        let children = warning
        if (warning.a1) {
            const { a1, a2, remain, isSell } = warning
            children = [
                <span>{tt('convert_assets_jsx.too_much_amount1')}</span>,
                <b>{a1}</b>,
                <span>{isSell ? tt('convert_assets_jsx.too_much_amount2') : tt('convert_assets_jsx.too_much_amount2a')}</span>,
                <b>{a2}</b>,
                <span>{tt('convert_assets_jsx.too_much_amount3')}</span>,
                <span>{remain}</span>,
                <span>{tt('convert_assets_jsx.too_much_amount4')}</span>
            ]
        }
        return (<div className='callout' style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                {children}
                &nbsp;
                <Icon name='info_o' title={tt('convert_assets_jsx.order_can_be_canceled')} />
            </div>)
    }

    render() {
        const { direction, isDialog, currentAccount } = this.props
        const { loading, finished, assets, isSubmitting, sellAmount, sellError, buyAmount, warning } = this.state
        if (loading || !currentAccount) {
            return (<center>
                <LoadingIndicator type='circle' size='25px' />
            </center>)
        }
        if (finished) {
            const { finishedAcc, remainToReceive } = this.state
            return <FinishedOrder finished={finished}
                finishedAcc={finishedAcc}
                buyAmount={buyAmount.asset} sellAmount={sellAmount.asset}
                remainToReceive={remainToReceive} />
        }
        const disabled = isSubmitting || !sellAmount.asset.amount || !buyAmount.asset.amount || sellError
        return (<div className='ConvertAssets'>
            <h3>{tt('g.convert_assets')}</h3>
            <div>
                <MarketPair assets={assets} itemsPerPage={8}
                    sym1={this.props.sellSym}
                    sym2={this.props.buySym}
                    linkComposer={isDialog ? undefined : (sym1, sym2) => {
                        return '/convert/' + sym1 + '/' + sym2
                    }}
                    label1={tt('convert_assets_jsx.sell')}
                    label2={tt('convert_assets_jsx.buy')}
                    onChange={this.onPairChange} />
                {this._renderDescription()}
            </div>
            <div style={{width: '300px'}}>
                <RadioButton id={1} title={tt('convert_alt_banner.direct_radio')} disabled={false} selectedValue={this.state.sel || 1} onChange={(e) => {
                    this.setState({sel: 1})}} />
            </div>
            {this._renderFields()}
            {this._renderWarning()}
            <div style={{width: '300px'}}>
                <RadioButton id={2} title={tt('convert_alt_banner.chain_radio')} disabled={false} hint='world2' selectedValue={this.state.sel || 1} onChange={(e) => {
                    this.setState({sel: 2})}} />
            </div>
            <div style={{ marginTop: '1.25rem' }}>
                <button onClick={this.submit} className='button' disabled={disabled}>
                    {direction === 'sell' ? tt('g.sell') : tt('g.buy')}
                </button>
                <a href={'/market/' + this.sellSym() + '/' + this.buySym()} className='MarketLink float-right'
                        style={{ paddingTop: '0.3rem', paddingRight: '0.1rem' }}>
                    <Icon name='trade' size='1_5x' />
                    <span style={{ verticalAlign: 'middle', marginLeft: '0.4rem' }}>
                        {tt('filled_orders_jsx.open_market')}
                    </span>
                </a>
            </div>
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        const defaults = state.user.get('convert_assets_defaults', Map()).toJS();

        const currentUser = state.user.getIn(['current'])
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        const isDialog = !!defaults.direction

        const routeParams = ownProps.routeParams || {}

        return {
            ...ownProps,
            sellSym: defaults.sellSym || routeParams.sym1 || undefined,
            buySym: defaults.buySym || routeParams.sym2 || undefined,
            direction: defaults.direction || undefined,
            isDialog,
            currentAccount,
        };
    },
    dispatch => ({
        placeOrders: (
                owner, orders, confirm, successCallback, errorCallback
            ) => {
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_create',
                    trx: orders,
                    username: owner,
                    confirm,
                    successCallback: () => {
                        let pathname = window.location.pathname
                        dispatch({type: 'FETCH_STATE', payload: {pathname}})
                        successCallback()
                    },
                    errorCallback: (err) => {
                        errorCallback(err)
                    }
                })
            )
        },
        placeOrder: (
                owner, amountToSell, minToReceive, confirm, successCallback, errorCallback
            ) => {
            const orderid = generateOrderID()

            const operation = {
                owner,
                amount_to_sell: amountToSell,
                min_to_receive: minToReceive,
                fill_or_kill: false,
                expiration: DEFAULT_EXPIRE,
                orderid,
            }

            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_create',
                    operation,
                    username: owner,
                    confirm,
                    successCallback: () => {
                        let pathname = window.location.pathname
                        dispatch({type: 'FETCH_STATE', payload: {pathname}})
                        successCallback(orderid)
                    },
                    errorCallback: (err) => {
                        errorCallback(err)
                    }
                })
            )
        },
        showOpenOrders: defaults => {
            dispatch(user.actions.setOpenOrdersDefaults(defaults))
            dispatch(user.actions.showOpenOrders())
            dispatch(user.actions.hideConvertAssets())
        },
    })
)(ConvertAssets)
