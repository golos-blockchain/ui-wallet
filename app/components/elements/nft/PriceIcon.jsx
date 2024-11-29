import React, { Component, } from 'react'

import { getAssetMeta } from 'app/utils/market/utils'

class PriceIcon extends Component {
    render() {
        let { asset, assets, title, text, ...rest } = this.props

        const assetData = assets && assets[asset.symbol]
        let imageUrl
        if (assetData) {
            imageUrl = getAssetMeta(assetData).image_url
        }

        const txt = text ? text(asset) : asset.floatString

        return <span title={title} {...rest}>
            {imageUrl && <img className='price-icon' src={imageUrl} alt={''} />}
            <span>{txt}</span>
        </span>
    }
}

export default PriceIcon
