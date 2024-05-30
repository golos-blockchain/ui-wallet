import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import { Link } from 'react-router'
import { api } from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'
import Reveal from 'react-foundation-components/lib/global/reveal'

import Expandable from 'app/components/elements/Expandable'
import Icon from 'app/components/elements/Icon'
import Hint from 'app/components/elements/common/Hint'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import TimeExactWrapper from 'app/components/elements/TimeExactWrapper'
import VerticalMenu from 'app/components/elements/VerticalMenu'
import NFTTokenSellPopup from 'app/components/elements/nft/NFTTokenSellPopup'
import PriceIcon from 'app/components/elements/nft/PriceIcon'
import NFTTokenTransfer from 'app/components/modules/nft/NFTTokenTransfer'
import NFTTokenSell from 'app/components/modules/nft/NFTTokenSell'
import NFTPlaceOfferBet from 'app/components/modules/nft/NFTPlaceOfferBet'
import NFTAuction from 'app/components/modules/nft/NFTAuction'
import NotFound from 'app/components/pages/NotFound'
import { msgsHost, msgsLink } from 'app/utils/ExtLinkUtils'
import transaction from 'app/redux/Transaction'

class NFTTokenPage extends Component {
    state = {
    }

    constructor(props) {
        super(props)
        this.sellPopupRef = React.createRef()
    }

    cancelOrder = async (e) => {
        e.preventDefault()
        const { nft_token, currentUser, } = this.props
        const token = nft_token.toJS()
        const { order } = token
        await this.props.cancelOrder(order.order_id, currentUser, () => {
            this.props.fetchState()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    buyToken = async (e) => {
        e.preventDefault()
        const { nft_token, currentUser, } = this.props
        const token = nft_token.toJS()
        const { token_id, order, json_metadata } = token
        let tokenTitle
        try {
            tokenTitle = JSON.parse(json_metadata).title.substring(0, 100) 
        } catch (err) {
            console.error(err)
            tokenTitle = '#' + token_id
        }
        const price = Asset(order.price).toString()

        await this.props.buyToken(token_id, order.order_id, tokenTitle, price, currentUser, () => {
            this.props.fetchState()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    onBurnClick = async (e) => {
        const { nft_token, currentUser, } = this.props
        const token = nft_token.toJS()
        const { token_id } = token
        await this.props.burnToken(token_id, currentUser, () => {
            this.props.fetchState()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    async loadOps() {
        try {
            const { nft_token, } = this.props
            const token = nft_token.toJS()
            const { token_id } = token
            const ops = await api.getNftTokenOps({
                token_ids: [ token_id ],
                from: 0,
                limit: 500
            })
            this.setState({
                ops: ops[token_id]
            })
        } catch (err) {
            console.error('loadOps', err)
        }
    }

    async loadOffers() {
        try {
            const { nft_token, } = this.props
            const token = nft_token.toJS()
            const { token_id, is_auction } = token
            if (is_auction) return
            const offers = await api.getNftOrdersAsync({
                select_token_ids: [ token_id ],
                limit: 100,
                type: 'buying'
            })
            this.setState({
                offers
            })
        } catch (err) {
            console.error('loadOffers', err)
        }
    }

    async loadBets() {
        try {
            const { nft_token, } = this.props
            const token = nft_token.toJS()
            const { token_id, is_auction } = token
            if (!is_auction) return
            const bets = await api.getNftBetsAsync({
                select_token_ids: [ token_id ],
                limit: 100,
            })
            this.setState({
                bets
            })
        } catch (err) {
            console.error('loadBets', err)
        }
    }

    async componentDidMount() {
        if (this.props.nft_token) {
            await this.loadOps()
            await this.loadOffers()
            await this.loadBets()
        }
    }

    async componentDidUpdate(prevProps) {
        if (this.props.nft_token && !prevProps.nft_token) {
            await this.loadOps()
            await this.loadOffers()
            await this.loadBets()
        }
    }

    componentWillUnmount() {
        this._unmount = true

        if (this._onAwayClickListen) {
            window.removeEventListener('mousedown', this._onAwayClick)
        }
    }

    showTransfer = (e) => {
        e.preventDefault()
        this.setState({
            showTransfer: true,
        })
    }

    hideTransfer = () => {
        this.setState({
            showTransfer: false,
        })
    }

    showSell = (e) => {
        this.setState({
            showSell: true,
        })
    }

    hideSell = () => {
        this.setState({
            showSell: false,
        })
    }

    showPlaceOfferBet = (e, minPrice) => {
        e.preventDefault()
        this.setState({
            showPlaceOfferBet: true,
            minPrice
        })
    }

    hidePlaceOfferBet = () => {
        this.setState({
            showPlaceOfferBet: false,
        })
    }

    showAuction = (e) => {
        this.setState({
            showAuction: true,
        })
    }

    hideAuction = () => {
        this.setState({
            showAuction: false,
        })
    }

    isOffers = () => {
        return window.location.hash === '#offers'
    }

    _renderOp = (trx, i) => {
        const [ opType, op ] = trx.op

        const accLink = (acc) => {
            let title = acc
            if (title.length > 16) {
                title = title.substr(0, 13) + '...'
            }
            return <Link to={'/@' + acc} title={acc}>{title}</Link>
        }

        let content
        if (opType === 'nft_token') {
            content = <div>
                {accLink(op.creator)}
                {tt('nft_token_page_jsx.issued')}
                {op.creator !== op.to ? <span>
                    {tt('nft_token_page_jsx.issued_for') + ' '}
                    {accLink(op.to)}
                </span> : null}
            </div>
        } else if (opType === 'nft_transfer') {
            content = <div>
                {accLink(op.from)}
                {tt('nft_token_page_jsx.transfered') + ' '}
                {accLink(op.to)}
            </div>
        } else if (opType === 'nft_sell') {
            const price = Asset(op.price)
            if (op.buyer) {
                content = <div>
                    {accLink(op.seller)}
                    {tt('nft_token_page_jsx.selled2')}
                    {accLink(op.buyer)}
                    {!price.eq(0) ? (tt('nft_token_page_jsx.selled2m') + price.floatString) : ''}
                </div>
            } else {
                content = <div>
                    {accLink(op.seller)}
                    {tt('nft_token_page_jsx.selled')}
                    {price.floatString}
                </div>
            }
        } else if (opType === 'nft_buy') {
            const price = Asset(op.price)
            if (!op.name) {
                content = <div>
                    {accLink(op.buyer)}
                    {tt('nft_token_page_jsx.bought')}
                    {!price.eq(0) ? (tt('nft_token_page_jsx.selled2m') + price.floatString) : ''}
                </div>
            } else {
                return null
            }
        }
        return <tr key={i}>
            <td><TimeAgoWrapper date={trx.timestamp} /></td>
            <td>{content}</td>
        </tr>
    }

    _renderOps = (ops) => {
        if (!ops) {
            return <LoadingIndicator type='circle' />
        }

        const rows = []
        for (let i = 0; i < ops.length; ++i) {
            const trx = ops[i]
            rows.push(this._renderOp(trx, i))
        }
        return <table><tbody>
            {rows}
        </tbody></table>
    }

    _renderOffers = (token, isMy) => {
        let offers
        if (isMy) {
            const offerObjs = this.state.offers
            if (offerObjs && offerObjs.length) {
                const sellToken = async (e, offer) => {
                    e.preventDefault()
                    await this.props.sellToken(offer, this.props.currentUser, () => {
                        this.props.fetchState()
                    }, (err) => {
                        if (!err || err.toString() === 'Canceled') return
                        console.error(err)
                        alert(err.toString())
                    })
                }

                const rows = []
                for (let i = 0; i < offerObjs.length; ++i) {
                    const offer = offerObjs[i]
                    rows.push(<tr key={offer.order_id}>
                        <td>{Asset(offer.price).floatString}</td>
                        <td><TimeAgoWrapper date={offer.created} /></td>
                        <td><button className='button' onClick={e => sellToken(e, offer)}>
                            {tt('g.sell')}
                        </button></td>
                    </tr>)
                }
                offers = <table style={{ marginBottom: '0rem' }}><tbody>
                    {rows}
                </tbody></table>
            } else {
                return null
            }

            const opened = this.isOffers()

            offers = <Expandable opened={opened} title={tt('nft_tokens_jsx.offers')}>
                {offers}
            </Expandable>
        }
        return offers
    }

    _renderBets = (token, isMy) => {
        let bets

        const betObjs = this.state.bets
        if (betObjs && betObjs.length) {
            const rows = []
            for (let i = 0; i < betObjs.length; ++i) {
                const bet = betObjs[i]
                rows.push(<tr key={bet.id}>
                    <td>{Asset(bet.price).floatString}</td>
                    <td><TimeAgoWrapper date={bet.created} /></td>
                </tr>)
            }
            bets = <table style={{ marginBottom: '0rem' }}><tbody>
                {rows}
            </tbody></table>
        } else {
            return null
        }

        bets = <Expandable title={tt('nft_tokens_jsx.bets')}>
            {bets}
        </Expandable>

        return bets
    }

    onSellClick = e => {
        e.preventDefault()
        this.sellPopupRef.current.togglePopup()
    }

    render() {
        if (!this.props.nft_token_loaded) {
            return <LoadingIndicator type='circle' />
        }

        const { nft_token, nft_assets, currentUser } = this.props

        const token = nft_token.toJS()

        if (!token.name) {
            return <NotFound.component />
        }

        if (token.burnt) {
            return <div className='row'>
                <div className='NFTTokenPage'>
                    <div>{tt('nft_token_page_jsx.burnt')}</div>
                    <div>{tt('nft_token_page_jsx.burnt2')}</div>
                    <div>{tt('nft_token_page_jsx.burnt3')}</div>
                </div>
            </div>
        }

        const assets = nft_assets.toJS()

        const { json_metadata, image, selling } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        let last_price
        const price = token.selling && Asset(token.order.price)
        if (price) {
            last_price = <PriceIcon title={price.floatString} text={a => {
                return ' ' + (token.selling ? tt('nft_tokens_jsx.selling_for') : '') + a.floatString
            }} asset={price} assets={assets} />
        }

        const dataStr = JSON.stringify(data, null, 2)

        const { ops } = this.state

        let title = data.title || ''
        if (title.length > 45) {
            title = title.substr(0, 45) + '...'
        }

        let name = token.name
        if (name.length > 38) {
            name = name.substr(0, 38) + '...'
        }

        const description = data.description || ''

        const username = currentUser && currentUser.get('username') 
        const isMy = username === token.owner

        let my_offer = token.my_offer ? Asset(token.my_offer.price) : null
        if (my_offer) {
            const cancelOffer = (e) => {
                this.props.cancelOffer(e, token.my_offer, () => {
                    this.props.fetchState()
                }, (err) => {
                    if (!err || err.toString() === 'Canceled') return
                    console.error(err)
                    alert(err.toString())
                })
            }
            my_offer = <div className='my_offer' style={{paddingLeft: last_price ? '0px': '5px'}}>
                <PriceIcon assets={assets} asset={my_offer} text={a => {
                    return ' ' + tt('nft_tokens_jsx.you_offer_is') + a.floatString
                }} style={{marginRight: '5px'}} />

                <button className='button hollow alert' onClick={cancelOffer}>
                    {tt('nft_tokens_jsx.cancel')}
                </button>
            </div>
        }

        const { auction_min_price, is_auction, my_bet } = token

        let auction
        if (is_auction) {
            const cancelAuction = (e) => {
                this.props.auction(token.token_id, Asset(0, 3, 'GOLOS'), new Date(0), username, () => {
                    this.props.fetchState()
                }, (err) => {
                    if (!err || err.toString() === 'Canceled') return
                    console.error(err)
                    alert(err.toString())
                })
            }
            const cancelBet = (e) => {
                this.props.buyToken(token.token_id, 0, '', '0.000 GOLOS', currentUser, () => {
                    this.props.fetchState()
                }, (err) => {
                    if (!err || err.toString() === 'Canceled') return
                    console.error(err)
                    alert(err.toString())
                })
            }
            auction = <div className='my_auction' style={{paddingTop: last_price ? '5px' : '0px', paddingLeft: last_price ? '0px': '5px'}}>
                <TimeExactWrapper date={token.auction_expiration}
                    tooltipRender={(tooltip) => tt('nft_tokens_jsx.auction_expiration3') + ': ' + tooltip}
                    contentRender={(content) => <React.Fragment>
                        <Icon name='clock' className='space-right' />
                        {content}
                    </React.Fragment>}
                />
                {isMy ? <PriceIcon assets={assets} asset={token.auction_min_price} text={a => {
                        return ' >= ' + a.amountFloat + ' ' + a.symbol
                    }} style={{marginLeft: '5px', marginRight: '5px'}} title={tt('nft_tokens_jsx.min_price_is') + auction_min_price.floatString} />  : null}
                {isMy ? <button className='button hollow alert' onClick={cancelAuction}>
                    {tt('nft_tokens_jsx.stop_auction')}
                </button> : (my_bet ? <span>
                    <PriceIcon assets={assets} asset={Asset(my_bet.price)} text={a => {
                        return ' ' + a.floatString
                    }} style={{marginLeft: '5px', marginRight: '5px'}} title={tt('nft_tokens_jsx.you_bet_is') + Asset(my_bet.price).floatString} />
                    <button className='button hollow alert' onClick={cancelBet} title={tt('nft_token_page_jsx.cancel_bet')}>
                        {tt('nft_tokens_jsx.cancel')}
                    </button></span> : <button className='button' onClick={e => this.showPlaceOfferBet(e, auction_min_price)}>
                        {tt('nft_tokens_jsx.place_bet')}
                    </button>)}
            </div>
        }

        return <div className='row'>
            <div className='NFTTokenPage'>
                <div className='container'>
                    <div style={{ paddingRight: '0.75rem' }}>
                        <a href={image} target='_blank' rel='noreferrer nofollow'>
                            <img src={image} />
                        </a>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <h4 style={{ marginBottom: '0.1rem'}} title={data.title}>
                            {title}
                        </h4>
                        <div>
                            <span className='secondary'>
                                <Link to={'/nft-collections/' + name} target='_blank' rel='noreferrer nofollow'>
                                    {name}
                                </Link>
                            </span>
                            <div style={{ float: 'right' }}>
                                <span className='secondary'>{tt('nft_token_page_jsx.owner_is')}</span>
                                <Link to={'/@' + token.owner}>
                                    {'@' + token.owner}
                                </Link>
                            </div>
                        </div>
                        {description ? <div style={{ marginTop: '0.7rem', flex: 1, wordWrap: 'break-word' }}>
                            {description}
                        </div> : null}
                        <Expandable title={tt('create_nft_collection_jsx.json_metadata')} style={{ marginTop: '0.5rem' }}>
                            <pre>
                                {dataStr}
                            </pre>
                        </Expandable>
                        <Expandable title={tt('userwallet_jsx.history_viewing')}>
                            {this._renderOps(ops)}
                        </Expandable>
                        {this._renderOffers(token, isMy)}
                        {this._renderBets(token, isMy)}
                        {!description ? <div style={{ flex: 1, wordWrap: 'break-word' }}>
                        </div> : null}
                        {isMy ? <div className='buttons'>
                            {last_price || auction}
                            {selling && <button className='button alert hollow button-center' title={tt('nft_tokens_jsx.cancel_hint')} onClick={this.cancelOrder}>
                                {tt('nft_tokens_jsx.cancel')}
                            </button>}
                            <span style={{ flex: 1}}></span>
                            <div className='sell-button'>
                                {(!selling && !is_auction) && <button className={'button' + (this.isOffers() ? ' hollow' : '')} onClick={this.onSellClick}>
                                    {tt('g.sell')}
                                </button>}
                                <NFTTokenSellPopup ref={this.sellPopupRef} is_auction={is_auction}
                                    showSell={this.showSell} showAuction={this.showAuction} />
                            </div>
                            {!selling && !is_auction && <button className='button hollow' onClick={this.showTransfer}>
                                {tt('g.transfer')}
                            </button>}
                            {!selling && !is_auction && <button className='button hollow alert' onClick={this.onBurnClick}>
                                {tt('g.burn')}
                            </button>}
                        </div> : <div className='buttons'>
                            {last_price || auction}
                            {selling && <button className='button button-center' title={tt('nft_tokens_jsx.buy2') + price.floatString} onClick={this.buyToken}>
                                {tt('nft_tokens_jsx.buy')}
                            </button>}
                            {!my_offer && !is_auction && <button className='button hollow' title={tt('nft_tokens_jsx.place_offer')} onClick={e => this.showPlaceOfferBet(e, false)}>
                                {tt('nft_tokens_jsx.place_offer')}
                            </button>}
                            {!selling && msgsHost() && <a href={msgsLink(token.owner)} target='_blank' rel='noreferrer nofollow' className='button hollow'>{tt('nft_token_page_jsx.msg')}</a>}
                            <span style={{ flex: 1}}></span>
                        </div>}
                        {my_offer}
                        {last_price ? auction : null}
                    </div>
                </div>
            </div>

            <Reveal show={this.state.showTransfer} onHide={this.hideTransfer} revealStyle={{ width: '450px' }}>
                <NFTTokenTransfer
                    currentUser={currentUser}
                    onClose={this.hideTransfer}
                    token={token}
                    refetch={this.props.fetchState}
                />
            </Reveal>

            <Reveal show={this.state.showSell} onHide={this.hideSell} revealStyle={{ width: '450px' }}>
                <NFTTokenSell
                    currentUser={currentUser}
                    onClose={this.hideSell}
                    token={token}
                    refetch={this.props.fetchState}
                />
            </Reveal>

            <Reveal show={this.state.showPlaceOfferBet} onHide={this.hidePlaceOfferBet} revealStyle={{ width: '450px' }}>
                <NFTPlaceOfferBet
                    currentUser={currentUser}
                    onClose={this.hidePlaceOfferBet}
                    token={token}
                    refetch={this.props.fetchState}
                    minPrice={this.state.minPrice}
                />
            </Reveal>

            <Reveal show={this.state.showAuction} onHide={this.hideAuction} revealStyle={{ width: '450px' }}>
                <NFTAuction
                    currentUser={currentUser}
                    onClose={this.hideAuction}
                    token={token}
                    refetch={() => {
                        this.props.fetchState()
                        this.setState({
                            offers: []
                        })
                    }}
                />
            </Reveal>
        </div>
    }
}

module.exports = {
    path: '/nft-tokens(/:id)',
    component: connect(
        // mapStateToProps
        (state, ownProps) => {
            const currentUser = state.user.getIn(['current'])

            return { ...ownProps,
                currentUser,
                nft_token: state.global.get('nft_token'),
                nft_token_loaded: state.global.get('nft_token_loaded'),
                nft_assets: state.global.get('nft_assets')
            }
        },

        dispatch => ({
            fetchState: () => {
                const pathname = window.location.pathname
                dispatch({type: 'FETCH_STATE', payload: {pathname}})
            },
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
            cancelOffer: (e, order, successCallback, errorCallback) => {
                e.preventDefault()

                const operation = {
                    owner: order.owner,
                    order_id: order.order_id
                }

                dispatch(transaction.actions.broadcastOperation({
                    type: 'nft_cancel_order',
                    confirm: tt('g.are_you_sure'),
                    username: order.owner,
                    operation,
                    successCallback,
                    errorCallback
                }))
            },
            sellToken: (offer, currentUser, successCallback, errorCallback) => {
                const username = currentUser.get('username')
                const operation = {
                    seller: username,
                    token_id: offer.token_id,
                    buyer: offer.owner,
                    order_id: offer.order_id,
                    price: offer.price
                }

                dispatch(transaction.actions.broadcastOperation({
                    type: 'nft_sell',
                    username,
                    operation,
                    successCallback,
                    errorCallback
                }))
            },
            auction: (
                token_id, min_price, expiration, username, successCallback, errorCallback
            ) => {
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
            }
        })
    )(NFTTokenPage)
}
