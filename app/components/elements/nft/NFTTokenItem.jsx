import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { Link } from 'react-router'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import g from 'app/redux/GlobalReducer'
import user from 'app/redux/User'
import transaction from 'app/redux/Transaction'
import { getAssetMeta } from 'app/utils/market/utils'

class NFTTokenItem extends Component {
    state = {}

    constructor() {
        super()
    }

    cancelOrder = async (e, tokenIdx) => {
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

    buyToken = async (e, tokenIdx) => {
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

    burnIt = async (e, tokenIdx) => {
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

    render() {
        const { token, tokenIdx, currentUser, page, assets } = this.props

        const { json_metadata, image, selling } = token

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
                this.burnIt(e, tokenIdx)
            }, value: tt('g.burn') })
        }

        if (last_price && !selling && isMy) {
            kebabItems.unshift({ link: '#', onClick: e => {
                this.props.showTransfer(e, tokenIdx)
            }, value: tt('g.transfer') })
        }

        const isCollection = page === 'collection'
        const isMarket = page === 'market'

        let buttons
        if (last_price) {
            buttons = <div>
                {last_price}
                {kebabItems.length > 1 ? <DropdownMenu className='float-right' el='div' items={kebabItems}>
                    <Icon name='new/more' size='0_95x' />
                </DropdownMenu> : null}
                {isMy && !selling && <button className='button slim float-right' onClick={e => this.props.showSell(e, tokenIdx)}>{tt('g.sell')}</button>}
                {isMy && selling && <button className='button slim alert hollow float-right' title={tt('nft_tokens_jsx.cancel_hint')}
                    onClick={e => this.cancelOrder(e, tokenIdx)}>
                    {tt('nft_tokens_jsx.cancel')}</button>}
                {!isMy && selling && <button className='button slim float-right' title={tt('nft_tokens_jsx.buy2') + price.floatString}
                    onClick={e => this.buyToken(e, tokenIdx)}>
                    {tt('nft_tokens_jsx.buy')}</button>}
            </div>
        } else {
            buttons = <div>
                {!isMy && <React.Fragment>&nbsp;</React.Fragment>}
                {isMy && <button className='button slim' onClick={e => this.props.showSell(e, tokenIdx)}>{tt('g.sell')}</button>}
                {isMy && <button className='button slim hollow' onClick={e => this.props.showTransfer(e, tokenIdx)}>{tt('g.transfer')}</button>}
                {kebabItems.length > 1 ? <DropdownMenu className='float-right' el='div' items={kebabItems}>
                    <Icon name='new/more' size='0_95x' />
                </DropdownMenu> : null}
            </div>
        }

        return <a href={link} target='_blank' rel='noopener noreferrer'>
            <div className={'NFTTokenItem ' + (isCollection && isMy ? ' collection' : '')}
                title={(isCollection && isMy) ? tt('nft_tokens_jsx.your_token') : ''}>
                <img className='token-image' src={image} alt='' title={data.title}/>
                {!isMy && <Link to={'/@' + token.owner} className='token-owner' title={tt('nft_tokens_jsx.owner')}>
                    {'@' + token.owner}
                </Link>}
                <div>
                    <h5 className='token-title'>{data.title}</h5>
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
                confirm: tt('nft_tokens_jsx.buy_confirm') + tokenTitle + tt('nft_tokens_jsx.buy_confirm2') + price + '?',
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
