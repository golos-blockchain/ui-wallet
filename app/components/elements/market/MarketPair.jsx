import React from 'react'
import PropTypes from 'prop-types'
import tt from 'counterpart'

import PagedDropdownMenu from 'app/components/elements/PagedDropdownMenu'
import Icon from 'app/components/elements/Icon'
import { apidexGetAll } from 'app/utils/ApidexApiClient'
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

            let maxDepth = 0
            const addDepth = (symbols) => {
                for (const asset of symbols) {
                    const cmc = this.cmc[asset.symbol]
                    asset.market_depth = parseFloat(asset.market_depth) || 0
                    if (cmc && cmc.price_usd && asset.market_depth) {
                        asset.market_usd = asset.market_depth * cmc.price_usd
                        if (asset.market_usd > maxDepth) {
                            maxDepth = asset.market_usd
                        }
                    }
                }
            }

            const symbols1 = lists[1].filter(filter)
            addDepth(symbols1)
            const symbols2 = lists[0].filter(filter)
            addDepth(symbols2)

            this.setState({
                symbols1,
                symbols2,
                sym1,
                sym2,
                maxDepth,
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
        this.cmc = (await apidexGetAll()).data
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

    makeStyle = (asset) => {
        const { maxDepth } = this.state
        let pct = Math.round(asset.market_usd / maxDepth * 100)
        if (pct < 10 && asset.market_depth >= 1) {
            pct = 10
        }
        let backColor = 'white'
        if (asset.symbol === 'GOLOS') {
            backColor = 'rgb(234, 240, 255)'
        } else if (asset.symbol === 'GBG') {
            backColor = 'rgb(254, 243, 222)'
        }
        const highlightColor = '#ecffeb'
        return {
            'background': 'linear-gradient(to left, ' + backColor + ' ' + pct + '%, ' + highlightColor + ' 1%)'
        }
    }

    render() {
        const { assets, slim, itemsPerPage, linkComposer, label1, label2 } = this.props
        const { sym1, sym2, symbols1, symbols2 } = this.state

        if (!symbols1 && !symbols2) return <div></div>

        const renderSym1 = (asset) => {
            const { symbol, image_url } = asset
            return {
                key: symbol, value: symbol,
                label: (<span className={'Market__bg-' + symbol} style={{lineHeight: '28px'}}><img src={image_url} width='28' height='28'/>&nbsp;&nbsp;&nbsp;{symbol}</span>),
                link: linkComposer(symbol, sym2),
                style: this.makeStyle(asset),
                onClick: (e) => {
                    this.onChange(e, symbol, sym2)
                }
            }
        }

        const renderSym2 = (asset) => {
            const { symbol, image_url } = asset
            return {
                key: symbol, value: symbol,
                label: (<span className={'Market__bg-' + symbol} style={{lineHeight: '28px'}}><img src={image_url} width='28' height='28'/>&nbsp;&nbsp;&nbsp;{symbol}</span>),
                link: linkComposer(sym1, symbol),
                style: this.makeStyle(asset),
                onClick: (e) => {
                    this.onChange(e, sym1, symbol)
                }
            }
        }
        
        let left = <div style={{ display: 'inline-block' }}>
                <div className='MarketPair__label'>{label1}</div>
                <PagedDropdownMenu el='div' className='top-most' items={symbols1} perPage={itemsPerPage}
                        renderItem={renderSym1}>
                    <span>
                        <img src={getAssetMeta(assets[sym1]).image_url || ''}
                            className='MarketPair__selected' />
                        {sym1}
                        {symbols1.length > 0 && <Icon name='dropdown-arrow' />}
                    </span>
                </PagedDropdownMenu>
            </div>

        let right = <div style={{ display: 'inline-block' }}>
                <div className='MarketPair__label'>{label2}</div>
                <PagedDropdownMenu el='div' className='top-most' items={symbols2} perPage={itemsPerPage}
                        renderItem={renderSym2}>
                    <span>
                        <img src={getAssetMeta(assets[sym2]).image_url || ''}
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
