/* eslint react/prop-types: 0 */
import React from 'react';
import {connect} from 'react-redux'
import { Link } from 'react-router'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import PriceIcon from 'app/components/elements/nft/PriceIcon'
import TimeExactWrapper from 'app/components/elements/TimeExactWrapper'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/Transaction'

const wrapAsTable = (immData, onRender, emptyHint) => {
    immData = immData.get('data').toJS()

    let res = []
    for (const item of immData) {
        res.push(onRender(item))
    }
    if (res.length) {
        res = <table><tbody>
            {res}
        </tbody></table>
    } else {
        res = emptyHint
    }

    return res
}

class NFTMyOrders extends React.Component {
    state = {}

    componentDidMount() {
        this.refetch()
    }

    refetch = () => {
        this.props.fetchNftOrders()
    }

    cancelOrder = (e, owner, order_id, tokenTitle) => {
        e.preventDefault()
        this.props.cancelOrder(owner, order_id, tokenTitle, () => {
            this.refetch()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    cancelBet = (e, owner, token_id, tokenTitle) => {
        e.preventDefault()
        this.props.cancelBet(owner, token_id, tokenTitle, () => {
            this.refetch()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    _renderOffer = (no, assets) => {
        const { token, price } = no
        const { image, name, token_id, json_metadata, } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        const title = data.title || (name + ' #' + token_id)

        const pr = Asset(price)

        const url = '/nft-tokens/' + token_id

        return <tr key={no.order_id}>
            <td title={title}>
                <NFTSmallIcon image={image} size='mini'
                    href={url} />
            </td>
            <td style={{ width: '33%' }}>
                <Link to={url} target='_blank' rel='noreferrer nofollow'>
                    {title}
                </Link>
            </td>
            <td style={{ width: '33%' }}>
                <PriceIcon text={a => {
                        return pr.amountFloat
                    }} asset={pr} assets={assets} title={pr.floatString} />
            </td>
            <td style={{ width: '33%' }}>
                <button className='button small hollow alert' onClick={e => this.cancelOrder(e, no.owner, no.order_id, title)}>
                    {tt('nft_tokens_jsx.cancel')}
                </button>
            </td>
        </tr>
    }

    _renderBet = (nb, assets) => {
        const { token, price } = nb
        const { image, name, token_id, json_metadata, auction_expiration } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        const title = data.title || (name + ' #' + token_id)

        const pr = Asset(price)

        const url = '/nft-tokens/' + token_id

        return <tr key={nb.ud}>
            <td title={title}>
                <NFTSmallIcon image={image} size='mini'
                    href={url} />
            </td>
            <td style={{ width: '33%' }}>
                <Link to={url} target='_blank' rel='noreferrer nofollow'>
                    {title}
                </Link>
            </td>
            <td style={{ width: '16%' }}>
                <PriceIcon text={a => {
                        return pr.amountFloat
                    }} asset={pr} assets={assets} title={pr.floatString} />
            </td>
            <td style={{ width: '16%' }}>
                <TimeExactWrapper date={auction_expiration} shorter={true}
                    tooltipRender={(tooltip) => tt('nft_tokens_jsx.auction_expiration3') + ': ' + tooltip}
                    contentRender={(content) => <React.Fragment>
                        <Icon name='clock' className='space-right' />
                        {content}
                    </React.Fragment>}
                />
            </td>
            <td style={{ width: '33%' }}>
                <button className='button small hollow alert' title={tt('nft_token_page_jsx.cancel_bet')} onClick={e => this.cancelBet(e, nb.owner, nb.token_id, title)}>
                    {tt('nft_tokens_jsx.cancel')}
                </button>
            </td>
        </tr>
    }

    _renderOffers = (assets) => {
        let { my_nft_offers } = this.props
        return wrapAsTable(my_nft_offers, no => this._renderOffer(no, assets),
            tt('nft_my_orders_jsx.offers_empty'))
    }

    _renderBets = (assets) => {
        let { my_nft_bets } = this.props

        return wrapAsTable(my_nft_bets, nb => this._renderBet(nb, assets),
            tt('nft_my_orders_jsx.bets_empty'))
    }

    render() {
        let { my_nft_offers, my_nft_bets, nft_assets } = this.props

        if (!my_nft_offers) {
            return <div className="UserWallet NFTMyOrders">
                <div className="row">
                    <LoadingIndicator type='circle' />
                </div>
            </div>
        }

        const assets = nft_assets ? nft_assets.toJS() : {}

        return (<div className="UserWallet NFTMyOrders">
            <div className="row">
                <div className="column small-12">
                    <h4>{tt('nft_my_orders_jsx.offers')}</h4>
                    {this._renderOffers(assets)}
                    <hr />
                    <h4>{tt('nft_my_orders_jsx.bets')}</h4>
                    {this._renderBets(assets)}
                </div>
            </div>
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        return {
            ...ownProps,
            my_nft_offers: state.global.get('my_nft_offers'),
            my_nft_bets: state.global.get('my_nft_bets'),
            nft_assets: state.global.get('nft_assets')
        }
    },
    dispatch => ({
        fetchNftOrders: () => {
            dispatch(g.actions.fetchNftOrders({ }))
        },
        cancelOrder: (
            owner, order_id, tokenTitle, successCallback, errorCallback
        ) => {
            const operation = {
                owner,
                order_id,
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_cancel_order',
                confirm: tt('nft_my_orders_jsx.confirm_cancel_offer_TOKEN', {
                    TOKEN: tokenTitle
                }),
                username: owner,
                operation,
                successCallback,
                errorCallback
            }))
        },
        cancelBet: (
            username, token_id, tokenTitle, successCallback, errorCallback
        ) => {
            const operation = {
                buyer: username,
                name: '',
                token_id,
                order_id: 0,
                price: '0.000 GOLOS'
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_buy',
                confirm: tt('nft_my_orders_jsx.confirm_cancel_bet_TOKEN', {
                    TOKEN: tokenTitle
                }),
                username,
                operation,
                successCallback,
                errorCallback
            }))
        },
    })
)(NFTMyOrders)
