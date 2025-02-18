import React from 'react'
import { connect, } from 'react-redux'
import { Link } from 'react-router'
import tt from 'counterpart'
import { api } from 'golos-lib-js'
import { Map, } from 'immutable'

import Author from 'app/components/elements/Author'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import AssetRules from 'app/components/modules/uia/AssetRules'
import QuickBuyForm from 'app/components/modules/uia/QuickBuyForm'
import quickBuyAssets from 'app/quickBuy'
import { getAssetMeta, } from 'app/utils/market/utils'
import { checkExchangePath, } from 'app/utils/market/exchangePath'
import { reloadLocation } from 'app/utils/app/RoutingUtils'

class QuickBuy extends React.Component {
    state = {
    }

    constructor(props) {
        super(props)
        this.load()
    }

    componentDidUpdate(prevProps) {
        if (this.props.sym1 !== prevProps.sym1) {
            this.setState({
                selected: this.props.sym1
            })
        }
    }

    load = async () => {
        const origs = { ...quickBuyAssets }
        let selected = this.props.sym1
        let sym2 = this.props.sym2
        let items = {}
        for (const [sym, obj] of Object.entries(origs)) {
            const { text, deposit, } = obj
            items[sym] = {
                description: text,
                deposit,
            }
            if (!selected) selected = sym
        }
        if (!items[sym2]) {
            items[sym2] = {}
        }
        const keys = Object.keys(items)

        const loadAsset = (sym, data) => {
            items[sym].creator = data.creator
            items[sym].whitelist = data.symbols_whitelist
            items[sym].precision = data.precision
            const meta = getAssetMeta(data)
            if (items[sym].deposit !== 'waiter') {
                items[sym].deposit = meta.deposit
            }
            items[sym].image_url = meta.image_url
            items[sym].telegram = meta.telegram
        }

        try {
            const path = await checkExchangePath(sym2, keys)
            for (const key of keys) {
                if (!path.assets[key]) {
                    delete items[key]
                    if (selected == key) {
                        selected = keys.length ? keys[keys.length - 1] : null
                    }
                } else {
                    loadAsset(key, path.assets[key])
                }
            }
            let buyAsset = {}
            this.setState({
                items, selected
            })
            return
        } catch (err) {
            console.error('Cannot load exchange path',err)
        }

        try {
            if (!keys.includes(sym2)) keys.push(sym2)
            let whitelist = []
            const datas = await api.getAssetsAsync('', keys)
            for (const data of datas) {
                const [_, symbol] = data.supply.split(' ')
                if (symbol === sym2) {
                    whitelist = data.symbols_whitelist
                    continue
                }
                loadAsset(symbol, data)
            }
            for (const sym of keys) {
                if (sym === sym2) continue
                if ((whitelist.length && !whitelist.includes(sym))
                    || (items[sym].whitelist.length && !items[sym].whitelist.includes(sym2))) {
                    delete items[sym]
                    const keys = Object.keys(items)
                    if (keys.length)
                        selected = keys[keys.length - 1]
                }
            }
        } catch (err) {
            console.error('Cannot load asset data',err)
        }
        this.setState({
            items, selected
        })
    }

    renderDetails = () => {
        const { items, selected } = this.state

        let __html = items[selected].description

        const root = document.createElement('div')
        root.innerHTML = __html
        let el
        while (el = root.getElementsByTagName('extlink')[0]) {
            const a = document.createElement('a')
            const href = el.getAttribute('href')
            a.href = href
            a.target = el.target || '_blank'
            a.rel = el.ref || 'noreferrer nofollow'
            a.textContent = el.textContent || href.split('https://').join('')
            el.parentNode.insertBefore(a, el)
            el.parentNode.removeChild(el)
        }
        __html = root.innerHTML

        const details = <div dangerouslySetInnerHTML={{ __html }}>
            </div>
        return details
    }

    tokenSelected = async (e) => {
        const { sym1 } = this.props
        const { waitingAmount } = this.state
        if (waitingAmount && !await DialogManager.dangerConfirm(tt('quickbuy_jsx.sym_change_warning_SYM', {
            SYM: sym1
        }))) {
            e.preventDefault()
            return
        }
        this.setState({
            waitingAmount: null
        })
    }

    render() {
        const { currentUser, sym2 } = this.props
        const { items, selected, waitingAmount, } = this.state
        if (!items || !currentUser) {
            return <div>
                <LoadingIndicator type='circle' />
            </div>
        }
        const itemKeys = Object.keys(items)
        if (!itemKeys.length || (itemKeys.length === 1 && itemKeys[0] === sym2)) {
            return <div>{tt('quickbuy_jsx.cannot_buy_TOKEN', {
                TOKEN: sym2
            })}</div>
        }
        let tabs = []
        for (const [key, data] of Object.entries(items)) {
            if (key === sym2) continue
            const displaySym = key.startsWith('YM') ? key.substring(2) : key
            tabs.push(<Link key={key} to={'/convert/' + key + '/' + sym2 + '?buy'}
                onClick={this.tokenSelected}>
                <div className={'uia' + (key === selected ? ' selected' : '')}>
                    <img src={data.image_url} />
                    {displaySym}
                </div>
            </Link>)
        }
        if (!items[selected]) {
            return <div>{tt('quickbuy_jsx.no_such_TOKEN', {
                TOKEN: selected
            })}</div>
        }

        let content

        const wrapContent = () => {
            content = <React.Fragment>
                <div className='row header-h1' style={{ marginTop: '1rem' }}>
                    <h1>{tt('quickbuy_jsx.go_step2')}</h1>
                </div>
                {content}
                <div className='row blue-box' style={{ marginTop: '1.5rem' }}>
                    {tt('quickbuy_jsx.for_example')} <br />
                    {this.renderDetails()}
                </div>
            </React.Fragment>
        }

        const { deposit, creator, telegram } = items[selected]
        if (!deposit || deposit.unavailable) {
            let { telegram } = items[selected]
            if (telegram) {
                telegram = 'https://t.me/' + encodeURIComponent(telegram)
                telegram = <a href={telegram} target='_blank' rel='nofollow noreferrer' style={{ marginLeft: '6px' }}>
                    <Icon name='new/telegram' title="Telegram" />
                </a>
            }
            content = <div>
                {tt('quickbuy_jsx.deposit_unavailable')}
                <Author author={creator} forceMsgs={true} />{telegram}
            </div>
            wrapContent()
        } else if (!waitingAmount) {
            content = <QuickBuyForm assets={items} buySym={sym2} sellSym={selected}
                onContinue={({ waitingAmount }) => {
                    const receivedAmount = waitingAmount.clone()
                    receivedAmount.amount = 0
                    this.setState({
                        waitingAmount,
                        receivedAmount,
                    })
                }}/>
        } else {
            const rules = {
                ...deposit,
                creator,
                isDeposit: true
            }
            const { receivedAmount } = this.state
            let title = ''
            if (receivedAmount.eq(0)) {
                title = <span>{tt('quick_buy_form_jsx.sell')}<b className='amount-bold'>{waitingAmount.floatString}</b></span>
            } else {
                const partly = waitingAmount.minus(receivedAmount)
                title = <span>{tt('quick_buy_form_jsx.partly')}
                    <b className='amount-bold'>{receivedAmount.floatString}</b>
                    {tt('quick_buy_form_jsx.partly2')}
                    <b className='amount-bold'>{partly.floatString}</b>
                    {tt('quick_buy_form_jsx.partly3')}
                </span>
            }
            content = <div>
                <div style={{ marginTop: '1rem' }}>
                    {rules ? <AssetRules sym={selected}
                            rules={rules} telegram={telegram} embed={true}
                            currentUser={currentUser}
                            waiterTitle={<div>{tt('quickbuy_jsx.step2', {
                                SYM1: selected,
                                SYM2: sym2
                            })}<br/>{title}</div>}
                            onTransfer={() => {
                                reloadLocation('/convert/' + selected + '/' + sym2)
                            }}
                        /> : null}
                </div>
            </div>
            wrapContent()
        }

        return <div className='QuickBuy'>
            <h3 align='center'>{tt('quickbuy_jsx.buy_SYM', {
                SYM: sym2
            })}
            </h3>
            <center>
                <h3 className='header-inline'>{tt('quickbuy_jsx.buy_with')}</h3>
                {tabs}
            </center>
            {content}
        </div>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        return { ...ownProps, currentUser, };
    },
    dispatch => ({
    })
)(QuickBuy)
