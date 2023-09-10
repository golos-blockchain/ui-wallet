import React from 'react'
import tt from 'counterpart'

import Icon from 'app/components/elements/Icon'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import PagedDropdownMenu from 'app/components/elements/PagedDropdownMenu'

class NFTMarketCollections extends React.Component {
    render() {
        let { nft_market_collections, selected } = this.props
        const nft_colls = nft_market_collections ? nft_market_collections.toJS() : []

        const colls = []
        colls.push({
            key: '_all',
            link: '/nft',
            label: <React.Fragment>
                <NFTSmallIcon image={null} />
                {tt('nft_market_page_jsx.all_collections')}
            </React.Fragment>,
            value: tt('nft_market_page_jsx.all_collections')
        })
        for (const nft_coll of nft_colls) {
            colls.push({
                key: nft_coll.name,
                link: '/nft/' + nft_coll.name,
                label: <React.Fragment>
                    <NFTSmallIcon image={nft_coll.image} />
                    {nft_coll.name}
                </React.Fragment>,
                value: nft_coll.name
            })
        }

        selected = selected || tt('nft_market_page_jsx.all_collections')

        return <PagedDropdownMenu className='NFTMarketCollections Witnesses__vote-list' el='div' items={colls}
            renderItem={item => item}
            selected={selected}
            perPage={20}>
            {selected}
            <Icon name="dropdown-arrow" />
        </PagedDropdownMenu>
    }
}

export default NFTMarketCollections
