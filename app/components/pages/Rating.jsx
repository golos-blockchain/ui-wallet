import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'
import { Link } from 'react-router'

import { getAssetMeta, } from 'app/utils/market/utils'

class Rating extends React.Component {
    constructor(props){
        super(props)
    }

    render() {
        const { pairs } = this.props
        if (!pairs) {
            return <div className='Rating'>
            </div>
        }

        const assets = this.props.assets.toJS()

        const pairItems = pairs.toJS().map(pair => {
            const { ticker } = pair
            const sym1 = ticker.asset1_volume.split(' ')[1]
            const sym2 = ticker.asset2_volume.split(' ')[1]

            let sym = sym1
            if (sym === 'GOLOS' && sym2 !== 'GBG') {
                sym = sym2
            }
            const asset = assets.find(item => {
                return item.supply.split(' ')[1] === sym
            })

            const link = '/market/' + sym1 + '/' + sym2

            const volume = ticker.asset1_volume.split(' ')[0]

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
                            {volume}
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
                assets: state.global.get('assetList'),
                pairs: state.global.get('pairs')
            }
        },
        dispatch => ({
        })
    )(Rating),
}