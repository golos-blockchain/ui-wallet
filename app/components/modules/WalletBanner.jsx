import React from 'react'
import { Link } from 'react-router'
import tt from 'counterpart'

import FitText from 'app/components/elements/FitText'
import Icon from 'app/components/elements/Icon'
import TimeExactWrapper from 'app/components/elements/TimeExactWrapper'
import { blogsUrl } from 'app/utils/blogsUtils'
import { proxifyNFTImage } from 'app/utils/ProxifyUrl'

export default class WalletBanner extends React.Component {
    constructor(props) {
        super(props)
        this.resize(null)
    }

    componentDidMount() {
        window.addEventListener('resize', this.resize)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize)
    }

    resize = (e) => {
        let size = 'large'
        if (window.innerWidth < 918) { // experimentally...
            size = 'small'
        } else if (window.innerWidth < 1200) {
            size = 'medium'
        }
        if (e) {
            this.setState({
                size
            })
        } else {
            this.state = { size } 
        }
    }

    render() {
        const { hot_auctions, account } = this.props
        const { size } = this.state

        let auctions = hot_auctions ? hot_auctions.toJS() : []

        if (auctions.length) {
            /*auctions = [auctions[0],auctions[0],auctions[0],auctions[0] ]
            auctions[0].json_metadata = JSON.stringify({
                title: 'Cat cat at cat at cat at cat at cat at cat  at cat at cat at cat at cat  at cat at cat at cat at cat '
            })*/
            if (auctions.length > 3) {
                if (size === 'small') {
                    auctions = auctions.slice(0, -2)
                } else if (size === 'medium') {
                    auctions.pop()
                }
            }

            let detailsLarge = auctions.length === 1 && window.innerWidth > 400

            const items = auctions.map(no => {
                const { json_metadata, image, selling, auction_expiration } = no

                let data
                if (json_metadata) {
                    data = JSON.parse(json_metadata)
                }
                data = data || {} // node allows to use '', null, object, or array

                const title = data.title || ''

                if (title.length < 20) detailsLarge = false

                let tokenImage = image.startsWith('http') ? proxifyNFTImage(image) : image

                let titleShrink = title
                const maxLength = detailsLarge ? 55 : 40
                if (titleShrink.length > maxLength) {
                    titleShrink = titleShrink.substring(0, maxLength - 3) + '...'
                }

                return <div className='nft-auction'>
                    <a href={'/nft-tokens/' + no.token_id} target='_blank' rel='noopener noreferrer' title={tt('wallet_banner_jsx.selling')}>
                        <img src={tokenImage} alt='' className='nft-image' />
                        <div className={'nft-details ' + (detailsLarge && 'large')}>
                            <div className='nft-title' title={tt('wallet_banner_jsx.selling_title') + title}>
                                {titleShrink}
                            </div>
                            <div className='nft-coll secondary'>
                                <Link to={'/nft-collections/' + no.name} target='_blank' rel='noreferrer nofollow'>
                                    {no.name}
                                </Link>
                            </div>
                            <div className='nft-timer'>
                                <TimeExactWrapper date={auction_expiration} shorter={true}
                                    tooltipRender={(tooltip) => tt('nft_tokens_jsx.auction_expiration3') + ': ' + tooltip}
                                    contentRender={(content) => <React.Fragment>
                                        <Icon name='clock' className='space-right' />
                                        {content}
                                    </React.Fragment>}
                                />
                            </div>
                        </div>
                    </a>
                </div>
            })
            return <div className='WalletBanner auctions'>
                {items}</div>
        }

        return <React.Fragment>
            <br />
            {Math.random() > 0.5 ?
            (<Link to={"/@" + account.get('name') + "/assets"}>
                <img src={require("app/assets/images/banners/golosdex.png")} width="800" height="100" />
            </Link>) :
            (<a target='_blank' href={blogsUrl('/@lex/alternativnyi-klient-blogov-golos-desktop-izmeneniya-v-tredakh-kommentariev')}>
                <img src={require('app/assets/images/banners/desktop.png')} width='800' height='100' />
            </a>)}
        </React.Fragment>
    }
}

