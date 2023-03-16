import React from 'react'

import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import tt from 'counterpart'

import { apidexGetPrices } from 'app/utils/ApidexApiClient'

class CMCSmall extends React.Component {
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
        let res = await apidexGetPrices('GOLOS')
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

        const className = 'CMCSmall ' + (this.props.className || '')

        if (!loaded) {
            return (<div className={className}>
                    <div className="CMCSmall__inner">
                        <div className='CMCSmall__inner2' style={{ 'justify-content': 'center' }} >
                            {!failed ?
                                <LoadingIndicator type='circle' size='25px' /> :
                                null}
                        </div>
                    </div>
                </div>)
        }

        return (<div className={className} onMouseMove={this.mouseEnter} onMouseOut={this.mouseOut}>
            <span style={{ fontSize: '16px' }}>
                <a href={page_url} target="_blank" rel='noopener nofollow' title='coinmarketcap.com'>
                    <Icon name={mouse ? 'trade_color2' : 'trade_color1'} className='CMCSmall__icon' />
                </a>
                <span className="CMCSmall__price">
                    <a href={page_url} target="_blank" rel='noopener nofollow' title='coinmarketcap.com'>
                        {price_rub ? price_rub.toFixed(5) + ' ₽' : null} 
                    </a>
                </span>
            </span>
            </div>)
    }
}

export default CMCSmall
