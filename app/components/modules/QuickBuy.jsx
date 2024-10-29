import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'
import { api } from 'golos-lib-js'
import { Map, } from 'immutable'

import Author from 'app/components/elements/Author'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import AssetRules from 'app/components/modules/uia/AssetRules'
import quickBuyAssets from 'app/quickBuy'
import { getAssetMeta, } from 'app/utils/market/utils'
import { reloadLocation } from 'app/utils/app/RoutingUtils'

class QuickBuy extends React.Component {
    state = {
    }

    constructor(props) {
        super(props)
        this.load()
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
        try {
            const keys = Object.keys(items)
            if (!keys.includes(sym2)) keys.push(sym2)
            let whitelist = []
            const datas = await api.getAssetsAsync('', keys)
            for (const data of datas) {
                const [_, symbol] = data.supply.split(' ')
                if (symbol === sym2) {
                    whitelist = data.symbols_whitelist
                    continue
                }
                items[symbol].creator = data.creator
                items[symbol].whitelist = data.symbols_whitelist
                const meta = getAssetMeta(data)
                if (items[symbol].deposit !== 'waiter') {
                    items[symbol].deposit = meta.deposit
                }
                items[symbol].image_url = meta.image_url
                items[symbol].telegram = meta.telegram
            }
            for (const sym of keys) {
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

    render() {
        const { currentUser, sym2 } = this.props
        const { items, selected, } = this.state
        if (!items || !currentUser) {
            return <div>
                <LoadingIndicator type='circle' />
            </div>
        }
        if (!Object.keys(items).length) {
            return <div>{tt('quickbuy_jsx.cannot_buy_TOKEN', {
                TOKEN: sym2
            })}</div>
        }
        let listItems = []
        for (const [key, data] of Object.entries(items)) {
            listItems.push({
                key, value: key,
                label: (<span style={{lineHeight: '28px'}}>
                        <img src={data.image_url} width='28' height='28'/>&nbsp;&nbsp;&nbsp;{key}
                    </span>),
                link: '/convert/' + key + '/' + sym2 + '?buy',
                onClick: (e) => {
                    this.setState({
                        selected: key
                    })
                }
            })
        }
        if (!items[selected]) {
            return <div>{tt('quickbuy_jsx.no_such_TOKEN', {
                TOKEN: selected
            })}</div>
        }
        const image_url = items[selected].image_url

        let content
        const { deposit, creator, telegram } = items[selected]
        if (deposit && !deposit.unavailable) {
            const rules = {
                ...deposit,
                creator,
                isDeposit: true
            }
            content = <div>
                <div style={{ marginTop: '1rem' }}>
                    {rules ? <AssetRules sym={selected}
                            rules={rules} telegram={telegram} embed={true}
                            currentUser={currentUser}
                            waiterTitle={tt('quickbuy_jsx.step2', {
                                SYM1: selected,
                                SYM2: sym2
                            })}
                            onTransfer={() => {
                                reloadLocation('/convert/' + selected + '/' + sym2)
                            }}
                        /> : null}
                </div>
            </div>
        } else {
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
        }

        return <div className='QuickBuy'>
            <h3 align='center'>{tt('quickbuy_jsx.buy_SYM_with', {
                SYM: sym2
            })}<DropdownMenu el='div' items={listItems} selected={selected}>
                    <span>
                        <img src={image_url} className='selected' />
                        {selected}
                        {listItems.length > 0 && <Icon name='dropdown-arrow' />}
                    </span>
                </DropdownMenu>
            </h3>
            <div className='row header-h1' style={{ marginTop: '1rem' }}>
                <h1>{tt('quickbuy_jsx.how_to')}</h1>
            </div>
            <div className='row' style={{ marginTop: '1.5rem' }}>
                {this.renderDetails()}
            </div>
            <div className='row header-h1' style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                <h1>{tt('quickbuy_jsx.go_step2')}</h1>
            </div>
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
