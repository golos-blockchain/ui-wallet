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
import NotFound from 'app/components/pages/NotFound'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/Transaction'
import session from 'app/utils/session'

const wrapAsTable = (immData, onRender, emptyHint) => {
    immData = immData.get('data').toJS()

    let res = []
    for (const item of immData) {
        res.push(onRender(item))
    }
    if (res.length) {
        res = <table style={{ marginTop: '0.75rem' }}><tbody>
            {res}
        </tbody></table>
    } else {
        res = <div>{emptyHint}</div>
    }

    return res
}

class NFTMyOrders extends React.Component {
    state = {}

    componentDidMount() {
        this.refetch(true)
    }

    refetch = (init = false) => {
        const { isModal } = this.props
        this.props.fetchNftOrders(isModal && 'GOLOS')
        if (!init && isModal) {
            this.props.fetchState() // update nft_hold_balance in wallet
        }
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

        let titleShrinked = title.substring(0, 37)
        const shrinked = titleShrinked !== title
        if (shrinked) titleShrinked += '...'

        const pr = Asset(price)

        const url = '/nft-tokens/' + token_id

        return <tr key={no.order_id}>
            <td title={title}>
                <NFTSmallIcon image={image} size='mini'
                    href={url} />
            </td>
            <td style={{ width: '33%' }} title={shrinked && title}>
                <Link to={url} target='_blank' rel='noreferrer nofollow'>
                    {titleShrinked}
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

        let titleShrinked = title.substring(0, 37)
        const shrinked = titleShrinked !== title
        if (shrinked) titleShrinked += '...'

        const pr = Asset(price)

        const url = '/nft-tokens/' + token_id

        return <tr key={nb.ud}>
            <td title={title}>
                <NFTSmallIcon image={image} size='mini'
                    href={url} />
            </td>
            <td style={{ width: '33%' }} title={shrinked && title}>
                <Link to={url} target='_blank' rel='noreferrer nofollow'>
                    {titleShrinked}
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

    _renderTabs = () => {
        const { section } = this.state

        let offers = <h4>{tt('nft_my_orders_jsx.offers')}</h4>
        let bets = <h4>{tt('nft_my_orders_jsx.bets')}</h4>

        const wrapLink = (item, tab) => {
            const switchTab = (e) => {
                e.preventDefault()
                this.setState({
                    section: tab
                })
            }
            return <a href='#' onClick={e => switchTab(e)}>{item}</a>
        }

        if (section === 'bets') {
            offers = wrapLink(offers, 'offers')
        } else {
            bets = wrapLink(bets, 'bets')
        }

        return <div>
            {offers}
            <h4>&nbsp;/&nbsp;</h4>
            {bets}
        </div>
    }

    _renderOffers = (assets) => {
        let { my_nft_offers, isModal } = this.props

        const offers = wrapAsTable(my_nft_offers, no => this._renderOffer(no, assets),
            tt('nft_my_orders_jsx.offers_empty'))

        return <React.Fragment>
            {!isModal && <h4>{tt('nft_my_orders_jsx.offers')}</h4>}
            {offers}
        </React.Fragment>
    }

    _renderBets = (assets) => {
        let { my_nft_bets, isModal } = this.props

        const bets = wrapAsTable(my_nft_bets, nb => this._renderBet(nb, assets),
            tt('nft_my_orders_jsx.bets_empty'))

        return <React.Fragment>
            {!isModal && <h4>{tt('nft_my_orders_jsx.bets')}</h4>}
            {bets}
        </React.Fragment>
    }

    render() {
        let { my_nft_offers, my_nft_bets, nft_assets,
            current_user, account, isModal } = this.props
        const { section } = this.state

        const username = session.load().currentName
        if (!isModal && (!username || !account || username !== account.name)) {
            if (account && account.name) {
                window.location.href = '/@' + account.name
            }
            return <NotFound.component />
        }

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
                    {isModal && this._renderTabs()}
                    {(!isModal || section !== 'bets') && this._renderOffers(assets)}
                    {!isModal && <hr />}
                    {(!isModal || section === 'bets') && this._renderBets(assets)}
                </div>
            </div>
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {locationBeforeTransitions: {pathname}} = state.routing
        const usernameFromRoute = pathname.split(`/`)[1].substring(1)
        return {
            ...ownProps,
            my_nft_offers: state.global.get('my_nft_offers'),
            my_nft_bets: state.global.get('my_nft_bets'),
            nft_assets: state.global.get('nft_assets'),
            usernameFromRoute
        }
    },
    dispatch => ({
        fetchState: () => {
            const pathname = window.location.pathname
            dispatch({type: 'FETCH_STATE', payload: {pathname}})
        },
        fetchNftOrders: (sym = undefined) => {
            dispatch(g.actions.fetchNftOrders({ sym }))
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
