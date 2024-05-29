import React, { Component, } from 'react'

import { proxifyNFTImage } from 'app/utils/ProxifyUrl'

class NFTSmallIcon extends Component {
    render() {
        const { image, size, href, ...rest } = this.props

        const url = image.startsWith('http') ? proxifyNFTImage(image) : image

        return <a className={'NFTSmallIcon ' + size} 
            style={{ backgroundImage: `url(${url})` }} href={href || url} target='_blank' rel='nofollow noreferrer' {...rest}></a>
    }
}

export default NFTSmallIcon
