import React, { Component, } from 'react'

import { proxifyNFTImage } from 'app/utils/ProxifyUrl'

class NFTSmallIcon extends Component {
    render() {
        const { image, ...rest } = this.props

        const url = image.startsWith('http') ? proxifyNFTImage(image) : image

        return <a className='NFTSmallIcon' 
            style={{ backgroundImage: `url(${url})` }} href={url} target='_blank' rel='nofollow noreferrer' {...rest}></a>
    }
}

export default NFTSmallIcon
