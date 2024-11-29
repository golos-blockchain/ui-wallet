import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { Link } from 'react-router'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import DropdownMenu from 'app/components/elements/DropdownMenu'
import FitText from 'app/components/elements/FitText'
import Icon from 'app/components/elements/Icon'
import NFTTokenSellPopup from 'app/components/elements/nft/NFTTokenSellPopup'
import PriceIcon from 'app/components/elements/nft/PriceIcon'
import TimeExactWrapper from 'app/components/elements/TimeExactWrapper'
import g from 'app/redux/GlobalReducer'
import user from 'app/redux/User'
import transaction from 'app/redux/Transaction'
import { getAssetMeta } from 'app/utils/market/utils'
import { proxifyNFTImage } from 'app/utils/ProxifyUrl'

class NFTTokenItem extends Component {
    state = {}

    constructor() {
        super()
        this.sellPopupRef = React.createRef()
    }

    cancelOrder = async (e) => {
        e.preventDefault()
        const { currentUser } = this.props
        const order = this.getOrder()
        await this.props.cancelOrder(order.order_id, currentUser, () => {
            this.props.refetch()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    cancelAuction = async (e) => {
        e.preventDefault()
        const { token, currentUser } = this.props
        const { token_id } = token
        this.props.auction(token.token_id, Asset(0, 3, 'GOLOS'), new Date(0), currentUser, () => {
            this.props.refetch()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    buyToken = async (e) => {
        e.preventDefault()
        const { token, currentUser } = this.props
        const { token_id, json_metadata } = token
        const order = this.getOrder()
        let tokenTitle
        try {
            tokenTitle = JSON.parse(json_metadata).title.substring(0, 100) 
        } catch (err) {
            console.error(err)
            tokenTitle = '#' + token_id
        }
        const price = Asset(order.price).floatString

        if (!currentUser) {
            this.props.login()
            return
        }
        await this.props.buyToken(token_id, order.order_id, tokenTitle, price, currentUser, () => {
            this.props.refetch()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    burnIt = async (e) => {
        e.preventDefault()
        const { token, currentUser } = this.props
        const { token_id } = token
        await this.props.burnToken(token_id, currentUser, () => {
            this.props.refetch()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    getOrder = () => {
        const { tokenOrder } = this.props
        if (tokenOrder) return tokenOrder
        return this.props.token.order
    }

    showSell = (e) => {
        e.preventDefault()
        this.sellPopupRef.current.togglePopup()
    }

    render() {
        const { token, tokenIdx, currentUser, page, assets } = this.props

        const { json_metadata, image, selling, is_auction, auction_expiration, my_bet, my_offer } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        let last_price
        const price = token.selling && Asset(this.getOrder().price)
        if (price) {
            const asset = assets[price.symbol]
            let imageUrl
            if (asset) {
                imageUrl = getAssetMeta(asset).image_url
            }
            last_price = <span title={tt('nft_tokens_jsx.selling_for') + price.floatString}>
                {imageUrl && <img className='price-icon' src={imageUrl} alt={''} />}
                <span style={{fontSize: price.amountFloat.length > 9 ? '90%' : '100%' }}>
                    {price.amountFloat}
                </span>
            </span>
        }

        const link = '/nft-tokens/' + token.token_id

        const kebabItems = [
            { link, target: '_blank', value: tt('g.more_hint') },
        ]

        const isMy = currentUser && currentUser.get('username') === token.owner

        if (isMy && !selling) {
            kebabItems.unshift({ link: '#', onClick: e => {
                this.burnIt(e)
            }, value: tt('g.burn') })
        }

        if (last_price && !selling && isMy) {
            kebabItems.unshift({ link: '#', onClick: e => {
                this.props.showTransfer(e, tokenIdx)
            }, value: tt('g.transfer') })
        }

        const isCollection = page === 'collection'
        const isMarket = page === 'market'

        if (!is_auction && !isMy && !my_offer) {
            kebabItems.unshift({ link: '#', onClick: e => {
                this.props.showPlaceOfferBet(e, isMarket ? token : tokenIdx)
            }, value: tt('nft_tokens_jsx.place_offer') })
        }

        const preventNavigate = (e) => {
            e.preventDefault()
        }

        let myBet
        if (my_bet) {
            const pr = Asset(my_bet.price)
            const cancelBet = (e) => {
                e.preventDefault()
                this.props.buyToken(token.token_id, 0, '', '0.000 GOLOS', currentUser, () => {
                    this.props.refetch()
                }, (err) => {
                    if (!err || err.toString() === 'Canceled') return
                    console.error(err)
                    alert(err.toString())
                })
            }
            myBet = <span className='token-owner my-bet-offer'
                        title={tt('nft_tokens_jsx.you_bet_is') + pr.floatString}
                        onClick={preventNavigate}>
                <PriceIcon text={a => {
                        return pr.amountFloat
                    }} asset={pr} assets={assets} />
                <Icon size='0_75x' name='cross' title={tt('nft_token_page_jsx.cancel_bet')} onClick={cancelBet} />
            </span>
        }

        let myOffer
        if (my_offer) {
            const pr = Asset(my_offer.price)
            const cancelOffer = (e) => {
                e.preventDefault()
                this.props.cancelOrder(my_offer.order_id, currentUser, () => {
                    this.props.refetch()
                }, (err) => {
                    if (!err || err.toString() === 'Canceled') return
                    console.error(err)
                    alert(err.toString())
                })
            }
            myOffer = <span className='token-owner my-bet-offer'
                        title={tt('nft_tokens_jsx.you_offer_is') + pr.floatString}
                        onClick={preventNavigate}>
                <PriceIcon text={a => {
                        return pr.amountFloat
                    }} asset={pr} assets={assets} />
                <Icon size='0_75x' name='cross' title={tt('nft_tokens_jsx.cancel')} onClick={cancelOffer} />
            </span>
        }

        let buttons
        if (last_price) {
            buttons = <div>
                {last_price}
                {kebabItems.length > 1 ? <DropdownMenu className='float-right' el='div' items={kebabItems}>
                    <Icon name='new/more' size='0_95x' />
                </DropdownMenu> : null}
                {isMy && !selling && <button className='button slim float-right' onClick={e => this.props.showSell(e, tokenIdx)}>{tt('g.sell')}</button>}
                {isMy && selling && <button className='button slim alert hollow noborder float-right' title={tt('nft_tokens_jsx.cancel_hint')}
                    onClick={e => this.cancelOrder(e)}>
                    {tt('g.cancel')}</button>}
                {!isMy && selling && <button className='button slim float-right' title={tt('nft_tokens_jsx.buy2') + price.floatString}
                    onClick={e => this.buyToken(e)}>
                    {tt('nft_tokens_jsx.buy')}</button>}
            </div>
        } else if (is_auction) {
            const { auction_min_price } = token
            buttons = <div>
                <span className='auction-time'>
                    <TimeExactWrapper date={auction_expiration} shorter={true}
                        tooltipRender={(tooltip) => tt('nft_tokens_jsx.auction_expiration3') + ': ' + tooltip}
                        contentRender={(content) => <React.Fragment>
                            <Icon name='clock' className='space-right' />
                            {content}
                        </React.Fragment>}
                    />
                </span>
                {isMy && <button className='button slim alert hollow noborder float-right' title={tt('nft_tokens_jsx.stop_auction')}
                    onClick={e => this.cancelAuction(e)}>
                    {tt('g.cancel')}</button>}
                {!isMy && !myBet && <button className='button slim float-right' title={tt('nft_tokens_jsx.min_price') + ' ' + auction_min_price.floatString}
                    onClick={e => this.props.showPlaceOfferBet(e, isMarket ? token : tokenIdx, auction_min_price)}>
                    {tt('nft_tokens_jsx.place_bet2')}</button>}
            </div>
        } else {
            buttons = <div>
                {!isMy && <React.Fragment>&nbsp;</React.Fragment>}
                {isMy && <div className='sell-button'>
                    <button className='button slim' onClick={this.showSell}>{tt('g.sell')}</button>
                    <NFTTokenSellPopup ref={this.sellPopupRef} is_auction={is_auction}
                        showSell={e => this.props.showSell(e, tokenIdx)}
                        showAuction={e => this.props.showAuction(e, tokenIdx)} />
                </div>}
                {isMy && <button className='button slim hollow noborder' onClick={e => this.props.showTransfer(e, tokenIdx)}>{tt('g.transfer')}</button>}
                {kebabItems.length > 1 ? <DropdownMenu className='float-right' el='div' items={kebabItems}>
                    <Icon name='new/more' size='0_95x' />
                </DropdownMenu> : null}
            </div>
        }

        let tokenImage = image.startsWith('http') ? proxifyNFTImage(image) : image

        return <a href={link} target='_blank' rel='noopener noreferrer'>
            <div className={'NFTTokenItem ' + (isCollection && isMy ? ' collection' : '')}
                title={(isCollection && isMy) ? tt('nft_tokens_jsx.your_token') : ''}>
                <img className='token-image' src={tokenImage} alt='' title={data.title}/>
                {!isMy && !myBet && !myOffer && <Link to={'/@' + token.owner} className='token-owner' title={tt('nft_tokens_jsx.owner')}>
                    {'@' + token.owner}
                </Link>}
                {token.has_offers && isMy && <a href={link + '#offers'} target='_blank' rel='noopener noreferrer' className='token-owner'>
                    {tt('nft_tokens_jsx.has_offers')}
                </a>}
                {myBet}
                {myOffer}
                <div>
                    <h5 className='token-title'>
                        <FitText text={data.title} maxWidth={200} shrink={40} />
                    </h5>
                    <span className='token-coll secondary'>
                        <Link to={'/nft-collections/' + token.name} target='_blank' rel='noreferrer nofollow'>
                            {token.name}
                        </Link>
                    </span>
                    {buttons}
                </div>
            </div>
        </a>
    }
}

export default connect(
    (state, ownProps) => {
        const {locationBeforeTransitions: {pathname}} = state.routing;
        let currentUser = ownProps.currentUser || state.user.getIn(['current']) 
        return { ...ownProps, currentUser }
    },
    dispatch => ({
        burnToken: (
            token_id, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            const operation = {
                from: username,
                to: 'null',
                token_id,
                memo: ''
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_transfer',
                confirm: tt('g.are_you_sure'),
                username,
                operation,
                successCallback,
                errorCallback
            }))
        },
        cancelOrder: (
            order_id, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            const operation = {
                owner: username,
                order_id,
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_cancel_order',
                confirm: tt('g.are_you_sure'),
                username,
                operation,
                successCallback,
                errorCallback
            }))
        },
        buyToken: (
            token_id, order_id, tokenTitle, price, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            const operation = {
                buyer: username,
                name: '',
                token_id,
                order_id,
                price: '0.000 GOLOS'
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_buy',
                confirm: tokenTitle ? 
                        tt('nft_tokens_jsx.buy_confirm') + tokenTitle + tt('nft_tokens_jsx.buy_confirm2') + price + '?' :
                        tt('g.are_you_sure'),
                username,
                operation,
                successCallback,
                errorCallback
            }))
        },
        auction: (
            token_id, min_price, expiration, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            const operation = {
                owner: username,
                token_id,
                min_price: min_price.toString(),
                expiration: expiration.toISOString().split('.')[0]
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_auction',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        },
        login: () => {
            dispatch(user.actions.showLogin({
                loginDefault: { unclosable: false }
            }));
        },
    })
)(NFTTokenItem)
