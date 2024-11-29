import React from 'react'
import tt from 'counterpart'

import Icon from 'app/components/elements/Icon'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import PagedDropdownMenu from 'app/components/elements/PagedDropdownMenu'
import { NFTImageStub } from 'app/utils/NFTUtils'

class NFTMarketCollections extends React.Component {
    render() {
        let { nft_market_collections, selected } = this.props
        const nft_colls = nft_market_collections ? nft_market_collections.toJS().data : []

        const colls = []
        colls.push({
            key: '_all',
            link: '/nft',
            value: tt('nft_market_collections_jsx.all_collections')
        })
        let i = 0
        for (const nft_coll of nft_colls) {
            colls.push({
                key: i,
                link: '/nft/' + nft_coll.name,
                label: <React.Fragment>
                    <NFTSmallIcon image={nft_coll.image} />
                    {nft_coll.name}
                </React.Fragment>,
                value: nft_coll.name
            })
            ++i
        }

        if (colls.length === 1) {
            return null
        }

        selected = selected || tt('nft_market_collections_jsx.all_collections')

        return <PagedDropdownMenu className='NFTMarketCollections Witnesses__vote-list' el='div' items={colls}
            renderItem={item => {
                const coll = nft_colls[item.key]
                const collImg = (coll && coll.image) || NFTImageStub()
                const collName = coll ? coll.name : tt('nft_market_collections_jsx.all_collections')

                let sellCount
                if (coll) {
                    sellCount = parseInt(coll.sell_order_count)
                    if (coll.auction_count) {
                        sellCount += parseInt(coll.auction_count)
                    }
                }

                return {
                    ...item,
                    label: <React.Fragment>
                        <NFTSmallIcon image={collImg} />
                        {collName}
                    </React.Fragment>,
                    addon: sellCount ?
                        <span style={{ position: 'absolute', right: '10px' }} title={tt('nft_market_collections_jsx.order_count', {count: coll.sell_order_count})}>
                            {sellCount}
                        </span> : null,
                }
            }}
            selected={selected}
            perPage={13}>
            {selected}
            <Icon name="dropdown-arrow" />
        </PagedDropdownMenu>
    }
}

export default NFTMarketCollections
