import React from 'react'
import PropTypes from 'prop-types'
import tt from 'counterpart'
import { api, libs } from 'golos-lib-js'

import PagedDropdownMenu from 'app/components/elements/PagedDropdownMenu'
import Icon from 'app/components/elements/Icon'
import { getAssetMeta, getTradablesFor } from 'app/utils/market/utils'

class MarketPair extends React.Component {
    static propTypes = {
        assets: PropTypes.object.isRequired,
        sym1: PropTypes.string,
        sym2: PropTypes.string,
        slim: PropTypes.bool,
        itemsPerPage: PropTypes.number,
        linkComposer: PropTypes.func,
        onChange: PropTypes.func,
    }

    static defaultProps = {
        itemsPerPage: 10,
        linkComposer: () => '#',
        onChange: () => {}
    }

    state = {
    }

    initLists = (sym1, sym2) => {
        if (sym1 && sym2) {
            const lists = getTradablesFor(this.props.assets, [sym1, sym2])

            const hiddenAssets = $STM_Config.hidden_assets ? Object.keys($STM_Config.hidden_assets) : []
            const filter = item => !hiddenAssets.includes(item.symbol)

            const getDepths = (depths, symbols, sym) => {
                let maxDepth = 0
                for (const asset of symbols) {
                    const dd = {}
                    for (const pair of this.pairs) {
                        const [ base_depth, base ] = pair[1].base_depth.split(' ')
                        const [ quote_depth, quote ] = pair[1].quote_depth.split(' ')
                        if (base === asset.symbol && quote === sym) {
                            dd.market_depth = parseFloat(base_depth) || 0
                            break
                        } else if (quote === asset.symbol && base === sym) {
                            dd.market_depth = parseFloat(quote_depth) || 0
                            break
                        }
                    }
                    const cmc = this.cmc[asset.symbol]
                    if (cmc && cmc.price_usd && dd.market_depth) {
                        dd.market_usd = dd.market_depth * cmc.price_usd
                        if (dd.market_usd > maxDepth) {
                            maxDepth = dd.market_usd
                        }
                    }
                    depths[asset.symbol] = dd
                }
                return maxDepth
            }

            const symbols1 = lists[1].filter(filter)
            const depths1 = []
            const maxDepth1 = getDepths(depths1, symbols1, sym2)

            const symbols2 = lists[0].filter(filter)
            const depths2 = []
            const maxDepth2 = getDepths(depths2, symbols2, sym1)

            this.setState({
                symbols1,
                symbols2,
                sym1,
                sym2,
                depths1,
                depths2,
                maxDepth1,
                maxDepth2,
            })
            this.onChange(null, sym1, sym2)
        } else if (sym1 || sym2) {
            const setSym = sym1 || sym2
            const oppoList = getTradablesFor(this.props.assets, [setSym], true)
            const oppoSym = oppoList[0][0].symbol
            if (sym1) {
                this.initLists(sym1, oppoSym)
            } else {
                this.initLists(oppoSym, sym2)
            }
        } else {
            this.initLists('GOLOS', 'GBG')
        }
    }

    async componentDidMount() {
        const { sym1, sym2 } = this.props
        this.cmc = (await libs.dex.apidexGetAll()).data
        try {
            this.pairs = (await api.getMarketPairsAsync({ merge: true, tickers: false, as_map: true })).data
        } catch (err) {
            console.error('Liquidity', err)
        }
        this.initLists(sym1, sym2)
    }

    onChange = (e, sym1, sym2) => {
        const { onChange, linkComposer } = this.props
        if (e) this.initLists(sym1, sym2)
        const link = linkComposer(sym1, sym2)
        const assets = this.props.assets
        const asset1 = assets[sym1]
        const asset2 = assets[sym2]
        onChange({ event: e, sym1, sym2, asset1, asset2, link })
    }

    onReversePair = (e) => {
        this.setState({
            symbols1: this.state.symbols2,
            symbols2: this.state.symbols1,
        })
        this.onChange(e, this.state.sym2, this.state.sym1)
    }

    makeItem = (asset, depths, maxDepth) => {
        let pct = 0
        const dd = depths[asset.symbol]
        // TODO: dd can be undefined, because when we switching symbols,
        // PagedDropdownMenu re-renders on old symbols (it caches them),
        // but with new depths.
        if (dd && dd.market_usd) {
            pct = dd.market_usd / maxDepth * 100
            // coefficients
            pct = Math.min(100, pct * 6)
            if (pct < 30) {
                pct = Math.min(30, pct * 5)
            }
        }

        const highlightColor = '#e2f7df'
        return {
            style: {
                'background': 'linear-gradient(to left, white ' + (100 - Math.round(pct)) + '%, ' + highlightColor + ' 1%)',
            },
            dataset: {
                market_usd: dd && dd.market_usd
            }
        }
    }

    render() {
        const { assets, slim, itemsPerPage, linkComposer, label1, label2 } = this.props
        const { sym1, sym2, symbols1, symbols2, depths1, depths2, maxDepth1, maxDepth2 } = this.state

        if (!symbols1 && !symbols2) return <div></div>

        const renderSym1 = (asset) => {
            const { symbol, } = asset
            const { style, dataset } = this.makeItem(asset, depths1, maxDepth1)
            let { image_url } = asset
            return {
                key: symbol, value: symbol,
                label: (<span className={'Market__bg-' + symbol} style={{lineHeight: '28px'}} data-usd={dataset.market_usd}><img src={image_url} width='28' height='28'/>&nbsp;&nbsp;&nbsp;{symbol}</span>),
                link: linkComposer(symbol, sym2),
                style,
                onClick: (e) => {
                    this.onChange(e, symbol, sym2)
                }
            }
        }

        const renderSym2 = (asset) => {
            const { symbol } = asset
            const { style, dataset } = this.makeItem(asset, depths2, maxDepth2)
            let { image_url } = asset
            return {
                key: symbol, value: symbol,
                label: (<span className={'Market__bg-' + symbol} style={{lineHeight: '28px'}} data-usd={dataset.market_usd}><img src={image_url} width='28' height='28'/>&nbsp;&nbsp;&nbsp;{symbol}</span>),
                link: linkComposer(sym1, symbol),
                style,
                onClick: (e) => {
                    this.onChange(e, sym1, symbol)
                }
            }
        }

        let sym1Image = getAssetMeta(assets[sym1]).image_url
        let left = <div style={{ display: 'inline-block' }}>
                <div className='MarketPair__label'>{label1}</div>
                <PagedDropdownMenu el='div' className='top-most' items={symbols1} perPage={itemsPerPage}
                        renderItem={renderSym1}>
                    <span>
                        <img src={sym1Image || ''}
                            className='MarketPair__selected' />
                        {sym1}
                        {symbols1.length > 0 && <Icon name='dropdown-arrow' />}
                    </span>
                </PagedDropdownMenu>
            </div>

        let sym2Image = getAssetMeta(assets[sym2]).image_url
        let right = <div style={{ display: 'inline-block' }}>
                <div className='MarketPair__label'>{label2}</div>
                <PagedDropdownMenu el='div' className='top-most' items={symbols2} perPage={itemsPerPage}
                        renderItem={renderSym2}>
                    <span>
                        <img src={sym2Image || ''}
                            className='MarketPair__selected' />
                        {sym2}
                        {symbols2.length > 0 && <Icon name='dropdown-arrow' />}
                    </span>
                </PagedDropdownMenu>
            </div>

        return (<div className={'MarketPair'}>
            {left}
            &nbsp;
            <a style={{ fill: 'gray',
                marginLeft: slim ? '0rem' : '1rem',
                marginRight: slim ? '0rem' : '1rem' }} href={linkComposer(sym2, sym1)}
                onClick={this.onReversePair}>
                <Icon name='shuffle' />
            </a>
            &nbsp;
            {right}
        </div>)
    }

}

export default MarketPair
