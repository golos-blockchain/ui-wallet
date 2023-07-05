import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'
import { Link } from 'react-router'
import { api } from 'golos-lib-js'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { getAssetMeta, } from 'app/utils/market/utils'
import { apidexGetAll } from 'app/utils/ApidexApiClient'

const RELOAD_EACH_MSEC = 30*1000

class Rating extends React.Component {
    constructor(props){
        super(props)
    }

    state = {}

    async loadData() {
        const assetList = await api.getAssetsAsync('', [], '', 5000, 'by_symbol_name', { system: true })
        const pairs = (await api.getMarketPairsAsync({ merge: true, tickers: true, bucket: 604800 })).data

        this.cmc = (await apidexGetAll()).data

        for (const pair of pairs) {
            const { ticker } = pair

            const [ volume1, sym1 ] = ticker.asset1_volume.split(' ')
            const [ volume2, sym2 ] = ticker.asset2_volume.split(' ')

            let reversed = (sym1 === 'GOLOS' && sym2 !== 'GBG')

            pair.latest = reversed ? parseFloat(ticker.latest2) : parseFloat(ticker.latest1)

            pair.volume = reversed ? volume2 : volume1
            pair.sym1 = reversed ? sym2 : sym1

            let cmc = this.cmc[pair.sym1]
            cmc = cmc && cmc.price_usd

            pair.volume_usd = cmc ? (pair.volume * cmc) : 0

            pair.sym2 = reversed ? sym1 : sym2

            pair.percent_change = reversed ? parseFloat(ticker.percent_change2) : parseFloat(ticker.percent_change1)
        }

        const hiddenAssets = $STM_Config.hidden_assets ? Object.keys($STM_Config.hidden_assets) : []
        let filtered = pairs.filter(pair => {
            return !hiddenAssets.includes(pair.sym1) && !hiddenAssets.includes(pair.sym2)
        })

        filtered.sort((pA, pB) => {
            const a = pA.volume_usd
            const b = pB.volume_usd
            if (a > b) return -1
            if (a < b) return 1
            return 0
        })

        await new Promise((resolve, reject) => {
            this.setState({
                assetList,
                pairs: filtered,
                reloading: false
            }, () => {
                resolve()
            })
        })
    }

    async loadingLoop(reloadEachMsec, isReload = false) {
        if (!isReload) {
            await this.loadData()
        } else {
            this.setState({ reloading: true })
            try {
                console.log('Reloading')
                await this.loadData()
            } catch (err) {
                console.error('Cannot reload rating', err)
            }
            this.setState({ reloading: false })
        }

        if (reloadEachMsec) {
            setTimeout(() => {
                this.loadingLoop(reloadEachMsec, true)
            }, reloadEachMsec)
        }
    }

    async componentDidMount() {
        await this.loadingLoop(RELOAD_EACH_MSEC)
    }

    _renderTop1(pair, assetList) {
        const { ticker, sym1, sym2, volume, volume_usd, percent_change, latest } = pair

        const asset = assetList.find(item => {
            return item.supply.split(' ')[1] === sym1
        })

        const link = '/market/' + sym1 + '/' + sym2

        return <Link to={link}><div className='Pair PairTop1'>
            <div className='Pair__logo'>
                <img src={getAssetMeta(asset).image_url || ''}
                    className='Pair__logo-img' />
            </div>
            <div className='Pair__main'>
                <div className='Pair__header'>
                    {sym1 + ' : ' + sym2}
                </div>
                <div className='Pair__info'>
                    {tt('rating_jsx.price')}
                    <span className='Pair__right'>
                        {latest.toFixed(8)}
                    </span>
                </div>
                <div className='Pair__info'>
                    {tt('rating_jsx.volume')}
                    <span className='Pair__right'>
                        {volume}
                    </span>
                </div>
                <div className='Pair__info'>
                    {tt('rating_jsx.volume2')}
                    <span className='Pair__right'>
                        {volume_usd.toFixed(3)}
                    </span>
                </div>
                <div className='Pair__info'>
                    {tt('rating_jsx.change')}
                    <span className='Pair__right'>
                        {percent_change > 0 ? (<span style={{ color: 'rgb(0, 150, 0)', fontWeight: 'bold' }}>
                            {percent_change.toFixed(2) + '%'}
                        </span>) : (percent_change < 0 ? (<span style={{ color: 'red', fontWeight: 'bold' }}>
                            {percent_change.toFixed(2) + '%'}
                        </span>) : (<span>
                            {percent_change.toFixed(2) + '%'}
                        </span>))}
                    </span>
                </div>
            </div>
        </div></Link>
    }

    render() {
        const { assetList, pairs, reloading } = this.state
        if (!pairs || reloading) {
            return <div className='Rating'>
                <LoadingIndicator type='circle' />
            </div>
        }

        let top1 = null
        let pairItems = []
        if (pairs.length > 1) {
            top1 = this._renderTop1(pairs[0], assetList)
        }

        for (let i = 1; i < pairs.length; ++i) {
            const pair = pairs[i]

            const { ticker, sym1, sym2, volume, volume_usd, percent_change, latest } = pair

            const asset = assetList.find(item => {
                return item.supply.split(' ')[1] === sym1
            })

            const link = '/market/' + sym1 + '/' + sym2

            pairItems.push(<Link to={link} key='link'><div className='Pair'>
                <div className='Pair__logo'>
                    <img src={getAssetMeta(asset).image_url || ''}
                        className='Pair__logo-img' />
                </div>
                <div className='Pair__main'>
                    <div className='Pair__header'>
                        {sym1 + ' : ' + sym2}
                    </div>
                    <div className='Pair__info'>
                        {tt('rating_jsx.price')}
                        <span className='Pair__right'>
                            {latest.toFixed(8)}
                        </span>
                    </div>
                    <div className='Pair__info'>
                        {tt('rating_jsx.volume')}
                        <span className='Pair__right'>
                            {volume}
                        </span>
                    </div>
                    <div className='Pair__info'>
                        {tt('rating_jsx.volume2')}
                        <span className='Pair__right'>
                            {volume_usd.toFixed(3)}
                        </span>
                    </div>
                    <div className='Pair__info'>
                        {tt('rating_jsx.change')}
                        <span className='Pair__right'>
                            {percent_change > 0 ? (<span style={{ color: 'rgb(0, 150, 0)', fontWeight: 'bold' }}>
                                {percent_change.toFixed(2) + '%'}
                            </span>) : (percent_change < 0 ? (<span style={{ color: 'red', fontWeight: 'bold' }}>
                                {percent_change.toFixed(2) + '%'}
                            </span>) : (<span>
                                {percent_change.toFixed(2) + '%'}
                            </span>))}
                        </span>
                    </div>
                </div>
            </div></Link>)
        }

        return <div className='row'>
            <div className='Rating'>
                {/*reloading ? <LoadingIndicator /> : null*/}
                <h4>{tt('navigation.market2')}</h4>
                {top1 ? <div>{top1}</div> : null}
                {pairItems}
            </div>
        </div>
    }
}

module.exports = {
    path: '/rating',
    component: connect(
        (state, ownProps) => {
            return {
            }
        },
        dispatch => ({
        })
    )(Rating),
}