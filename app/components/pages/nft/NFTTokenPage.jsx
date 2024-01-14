import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import { Link } from 'react-router'
import { api } from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'
import Reveal from 'react-foundation-components/lib/global/reveal'

import Expandable from 'app/components/elements/Expandable'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import NFTTokenTransfer from 'app/components/modules/nft/NFTTokenTransfer'
import NFTTokenSell from 'app/components/modules/nft/NFTTokenSell'
import NFTPlaceBet from 'app/components/modules/nft/NFTPlaceBet'
import NotFound from 'app/components/pages/NotFound'
import { msgsHost, msgsLink } from 'app/utils/ExtLinkUtils'
import { getAssetMeta } from 'app/utils/market/utils'
import transaction from 'app/redux/Transaction'

class NFTTokenPage extends Component {
    state = {
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
        const price = Asset(order.price).floatString

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

    async loadBets() {
        try {
            const { nft_token, } = this.props
            const token = nft_token.toJS()
            const { token_id } = token
            const bets = await api.getNftOrdersAsync({
                select_token_ids: [ token_id ],
                limit: 100,
                type: 'buying'
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
            await this.loadBets()
        }
    }

    async componentDidUpdate(prevProps) {
        if (this.props.nft_token && !prevProps.nft_token) {
            await this.loadOps()
            await this.loadBets()
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
        e.preventDefault()
        this.setState({
            showSell: true,
        })
    }

    hideSell = () => {
        this.setState({
            showSell: false,
        })
    }

    showPlaceBet = (e) => {
        e.preventDefault()
        this.setState({
            showPlaceBet: true,
        })
    }

    hidePlaceBet = () => {
        this.setState({
            showPlaceBet: false,
        })
    }

    isBets = () => {
        return window.location.hash === '#bets'
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
            } else if (op.token_id) {
                content = <div>
                    {accLink(op.buyer)}
                    {tt('nft_token_page_jsx.placed_bet')}
                    {tt('nft_token_page_jsx.selled2m')}
                    {price.floatString}
                </div>
            } else {
                return null
            }
        }
        return <tr>
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

    _renderBets = (token, isMy) => {
        let bets
        if (isMy) {
            const betObjs = this.state.bets
            if (betObjs && betObjs.length) {
                const sellToken = async (e, bet) => {
                    e.preventDefault()
                    await this.props.sellToken(bet, this.props.currentUser, () => {
                        this.props.fetchState()
                    }, (err) => {
                        if (!err || err.toString() === 'Canceled') return
                        console.error(err)
                        alert(err.toString())
                    })
                }

                const rows = []
                for (let i = 0; i < betObjs.length; ++i) {
                    const bet = betObjs[i]
                    rows.push(<tr key={bet.order_id}>
                        <td>{Asset(bet.price).floatString}</td>
                        <td><TimeAgoWrapper date={bet.created} /></td>
                        <td><button className='button' onClick={e => sellToken(e, bet)}>
                            {tt('g.sell')}
                        </button></td>
                    </tr>)
                }
                bets = <table style={{ marginBottom: '0rem' }}><tbody>
                    {rows}
                </tbody></table>
            } else {
                return null
            }

            const opened = this.isBets()

            bets = <Expandable opened={opened} title={tt('nft_tokens_jsx.bets')}>
                {bets}
            </Expandable>
        }
        return bets
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
            const asset = assets[price.symbol]
            let imageUrl
            if (asset) {
                imageUrl = getAssetMeta(asset).image_url
            }
            last_price = <span title={price.floatString}>
                {imageUrl && <img className='price-icon' src={imageUrl} alt={''} />}
                {(token.selling ? (' ' + tt('nft_tokens_jsx.selling_for')) : '') + price.floatString}
            </span>
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

        const isMy = currentUser && currentUser.get('username') === token.owner

        let my_bet = token.my_bet ? Asset(token.my_bet.price) : null
        if (my_bet) {
            const asset = assets[my_bet.symbol]
            let imageUrl
            if (asset) {
                imageUrl = getAssetMeta(asset).image_url
            }
            const cancelBet = (e) => {
                this.props.cancelBet(e, token.my_bet, () => {
                    this.props.fetchState()
                }, (err) => {
                    if (!err || err.toString() === 'Canceled') return
                    console.error(err)
                    alert(err.toString())
                })
            }
            my_bet = <div className='my_bet' style={{paddingLeft: last_price ? '0px': '5px'}}>
                {imageUrl && <img className='price-icon' src={imageUrl} alt={''} />}
                <span>{tt('nft_tokens_jsx.you_bet_is') + my_bet.floatString}</span>
                <button className='button hollow alert' onClick={cancelBet}>
                    {tt('nft_tokens_jsx.cancel')}
                </button>
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
                        {this._renderBets(token, isMy)}
                        {!description ? <div style={{ flex: 1, wordWrap: 'break-word' }}>
                        </div> : null}
                        {isMy ? <div className='buttons'>
                            {last_price}
                            {selling && <button className='button alert hollow button-center' title={tt('nft_tokens_jsx.cancel_hint')} onClick={this.cancelOrder}>
                                {tt('nft_tokens_jsx.cancel')}
                            </button>}
                            <span style={{ flex: 1}}></span>
                            {!selling && <button className={'button' + (this.isBets() ? ' hollow' : '')} onClick={this.showSell}>
                                {tt('g.sell')}
                            </button>}
                            {!selling && <button className='button hollow' onClick={this.showTransfer}>
                                {tt('g.transfer')}
                            </button>}
                            {!selling && <button className='button hollow alert' onClick={this.onBurnClick}>
                                {tt('g.burn')}
                            </button>}
                        </div> : <div className='buttons'>
                            {last_price}
                            {selling && <button className='button button-center' title={tt('nft_tokens_jsx.buy2') + price.floatString} onClick={this.buyToken}>
                                {tt('nft_tokens_jsx.buy')}
                            </button>}
                            {!my_bet && <button className='button hollow' title={tt('nft_tokens_jsx.place_bet')} onClick={this.showPlaceBet}>
                                {tt('nft_tokens_jsx.place_bet')}
                            </button>}
                            {!selling && msgsHost() && <a href={msgsLink(token.owner)} target='_blank' rel='noreferrer nofollow' className='button hollow'>{tt('nft_token_page_jsx.msg')}</a>}
                            <span style={{ flex: 1}}></span>
                        </div>}
                        {my_bet}
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

            <Reveal show={this.state.showPlaceBet} onHide={this.hidePlaceBet} revealStyle={{ width: '450px' }}>
                <NFTPlaceBet
                    currentUser={currentUser}
                    onClose={this.hidePlaceBet}
                    token={token}
                    refetch={this.props.fetchState}
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
                    confirm: tt('nft_tokens_jsx.buy_confirm') + tokenTitle + tt('nft_tokens_jsx.buy_confirm2') + price + '?',
                    username,
                    operation,
                    successCallback,
                    errorCallback
                }))
            },
            cancelBet: (e, order, successCallback, errorCallback) => {
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
            sellToken: (bet, currentUser, successCallback, errorCallback) => {
                const username = currentUser.get('username')
                const operation = {
                    seller: username,
                    token_id: bet.token_id,
                    buyer: bet.owner,
                    order_id: bet.order_id,
                    price: bet.price
                }

                dispatch(transaction.actions.broadcastOperation({
                    type: 'nft_sell',
                    username,
                    operation,
                    successCallback,
                    errorCallback
                }))
            }
        })
    )(NFTTokenPage)
}
