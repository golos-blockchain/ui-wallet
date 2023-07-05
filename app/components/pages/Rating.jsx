import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'
import { Link } from 'react-router'
import { api } from 'golos-lib-js'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { getAssetMeta, } from 'app/utils/market/utils'
import { apidexGetAll } from 'app/utils/ApidexApiClient'

class Rating extends React.Component {
    constructor(props){
        super(props)
    }

    state = {}

    async componentDidMount() {
        const assetList = await api.getAssetsAsync('', [], '', 5000, 'by_symbol_name', { system: true })
        const pairs = (await api.getMarketPairsAsync({ merge: true, tickers: true, bucket: 604800 })).data

        this.cmc = (await apidexGetAll()).data

        for (const pair of pairs) {
            const { ticker } = pair

            const [ volume1, sym1 ] = ticker.asset1_volume.split(' ')

            pair.volume = volume1
            pair.sym1 = sym1

            let cmc = this.cmc[sym1]
            cmc = cmc && cmc.price_usd

            pair.volume_usd = cmc ? (volume1 * cmc) : 0

            pair.sym2 = ticker.asset2_volume.split(' ')[1]
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

        this.setState({
            assetList,
            pairs: filtered
        })
    }

    render() {
        const { assetList, pairs } = this.state
        if (!pairs) {
            return <div className='Rating'>
                <LoadingIndicator type='circle' />
            </div>
        }

        const pairItems = pairs.map(pair => {
            const { ticker, sym1, sym2, volume, volume_usd } = pair

            const asset = assetList.find(item => {
                return item.supply.split(' ')[1] === sym1
            })

            const link = '/market/' + sym1 + '/' + sym2

            return <Link to={link}><div className='Pair'>
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
                            {parseFloat(ticker.latest1).toFixed(8)}
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
                            {parseFloat(ticker.percent_change1).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div></Link>
        })

        return <div className='row'>
            <div className='Rating'>
                <h4>{tt('navigation.market2')}</h4>
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