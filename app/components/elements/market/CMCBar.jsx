import React from 'react'
import { libs } from 'golos-lib-js'

import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import tt from 'counterpart'

class CMCBar extends React.Component {
    state = {
        loaded: false
    }

    getPriceChange = (res) => {
        let price_change = null
        try {
            price_change = res.data.quote.RUB.percent_change_24h
        } catch (err) {}
        if (price_change) {
            price_change = parseFloat(price_change)
            if (isNaN(price_change)) {
                price_change = null
            }
        }
        return price_change
    }

    async componentDidMount() {
        let res = await libs.dex.apidexGetPrices({ sym: 'GOLOS' })
        if (res.price_rub) {
            const price_change = this.getPriceChange(res)
            this.setState({
                loaded: true,
                price_usd: res.price_usd,
                price_rub: res.price_rub,
                page_url: res.page_url,
                price_change,
            })
        } else {
            this.setState({
                failed: true
            })
        }
    }

    mouseEnter = (e) => {
        e.preventDefault()
        this.setState({
            mouse: true
        })
    }

    mouseOut = (e) => {
        e.preventDefault()
        this.setState({
            mouse: false
        })
    }

    render() {
        const { loaded, failed, price_usd, price_rub, page_url, price_change, mouse } = this.state
        if (!loaded) {
            return (<div class="CMCBar">
                    <div className="CMCBar__inner">
                        <div className='CMCBar__inner2' style={{ 'justify-content': 'center' }} >
                            {!failed ?
                                <LoadingIndicator type='circle' size='25px' /> :
                                null}
                        </div>
                    </div>
                </div>)
        }

        const header = (price_rub || price_usd) ? 
            <span className='CMCBar_header'>
                <a href={page_url} target="_blank" rel='noopener nofollow' title='coinmarketcap.com'>
                    {'1 GOLOS = '}
                </a>
            </span> : null

        return (<div className="CMCBar" onMouseMove={this.mouseEnter} onMouseOut={this.mouseOut}>
            <span style={{ fontSize: '16px' }}>
                <a href={page_url} target="_blank" rel='noopener nofollow' title='coinmarketcap.com'>
                    <Icon name={mouse ? 'trade_color2' : 'trade_color1'} className='CMCBar__icon' />
                </a>
                {header}
                <span className="CMCBar__price">
                    <a href={page_url} target="_blank" rel='noopener nofollow' title='coinmarketcap.com'>
                        {price_rub ? price_rub.toFixed(5) + ' ₽' : null} 
                    </a>            
                    <span className="CMCBar__price-change">
                        {(price_change && price_change.toFixed) ? <span style={{ color: price_change < 0 ? '#d94040' : '#009600' }}>{' '}({price_change.toFixed(2)}%)</span> : null}
                    </span>
                </span>   
                <span className="CMCBar__price-usd">
                    {price_usd ? price_usd.toFixed(5) + ' $' : null}
                </span>
                <span className="CMCBar__link-parent">
                    <a href="/exchanges" className="CMCBar__link">{tt('g.buy_or_sell')}</a>
                </span>
            </span>
            </div>)
    }
}

export default CMCBar
