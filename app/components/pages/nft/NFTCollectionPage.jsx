import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import { Link } from 'react-router'
import Reveal from 'react-foundation-components/lib/global/reveal'

import IssueNFTToken from 'app/components/modules/nft/IssueNFTToken'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTAuction from 'app/components/modules/nft/NFTAuction'
import NFTTokenItem from 'app/components/elements/nft/NFTTokenItem'
import NFTTokenTransfer from 'app/components/modules/nft/NFTTokenTransfer'
import NFTTokenSell from 'app/components/modules/nft/NFTTokenSell'
import NFTPlaceOfferBet from 'app/components/modules/nft/NFTPlaceOfferBet'
import NotFound from 'app/components/pages/NotFound'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/Transaction'

class NFTCollectionPage extends Component {
    state = {
    }

    componentDidMount() {
        this.refetch()
    }

    componentDidUpdate() {
        if (!this.props.nft_tokens)
            this.refetch()
    }

    refetch = () => {
        this.props.fetchNftCollectionTokens(this.props.routeParams.name,
            0, this.sort, this.sortReversed)
    }

    showIssue = (e) => {
        e.preventDefault()
        const { nft_collection, } = this.props

        const coll = nft_collection.toJS()

        const { name, token_count } = coll
        this.setState({
            showIssue: true,
            issueName: name,
            issueNum: token_count + 1
        })
    }

    hideIssue = () => {
        this.setState({
            showIssue: false,
        })
    }

    deleteIt = async (e) => {
        e.preventDefault()

        const { currentUser, nft_collection } = this.props
        const coll = nft_collection.toJS()

        await this.props.deleteCollection(coll.name, currentUser, () => {
            this.refetch()
        }, (err) => {
            console.error(err)
        })
    }

    showTransfer = (e, tokenIdx) => {
        e.preventDefault()
        this.setState({
            showTransfer: true,
            tokenIdx,
        })
    }

    hideTransfer = () => {
        this.setState({
            showTransfer: false,
        })
    }

    showSell = (e, tokenIdx) => {
        e.preventDefault()
        this.setState({
            showSell: true,
            tokenIdx,
        })
    }

    hideSell = () => {
        this.setState({
            showSell: false,
        })
    }

    hideSell = () => {
        this.setState({
            showSell: false,
        })
    }

    showPlaceOfferBet = (e, tokenIdx, minPrice) => {
        e.preventDefault()
        this.setState({
            showPlaceOfferBet: true,
            tokenIdx,
            minPrice
        })
    }

    hidePlaceOfferBet = () => {
        this.setState({
            showPlaceOfferBet: false,
        })
    }

    showAuction = (e, tokenIdx) => {
        e.preventDefault()
        this.setState({
            showAuction: true,
            tokenIdx,
        })
    }

    hideAuction = () => {
        this.setState({
            showAuction: false,
        })
    }

    onBurnClick = async (e) => {
        const { nft_token, currentUser, } = this.props
        const token = nft_token.toJS()
        const { token_id } = token
        await this.props.burnToken(token_id, currentUser, () => {
            this.refetch()
        }, (err) => {
            if (!err || err.toString() === 'Canceled') return
            console.error(err)
            alert(err.toString())
        })
    }

    render() {
        const { nft_collection, nft_collection_loaded, nft_tokens, nft_assets, currentUser } = this.props

        if (!nft_collection_loaded) {
            return <div className='row'>
                <div className='NFTCollectionPage'>
                    <LoadingIndicator type='circle' />
                </div>
            </div>
        }

        const coll = nft_collection.toJS()

        if (!coll.name) {
            return <NotFound.component />
        }

        const tokens = nft_tokens ? nft_tokens.toJS().data : null
        const assets = nft_assets ? nft_assets.toJS() : null

        const next_from = nft_tokens && nft_tokens.get('next_from')

        let items = []
        if (!tokens) {
            items = <LoadingIndicator type='circle' />
        } else if (!tokens.length) {
            items = <span>{tt('nft_collection_page_jsx.not_yet')}</span>
        } else {
            for (let i = 0; i < tokens.length; ++i) {
                const token = tokens[i]
                items.push(<NFTTokenItem key={i} token={token} tokenIdx={i}
                    assets={assets}
                    showTransfer={this.showTransfer}
                    showSell={this.showSell}
                    showPlaceOfferBet={this.showPlaceOfferBet}
                    showAuction={this.showAuction}
                    refetch={this.refetch}
                    page='collection' />)
            }
        }

        const { showIssue, issueName, issueNum, showTransfer, showSell, showAuction, showPlaceOfferBet, tokenIdx } = this.state

        const isMy = currentUser && currentUser.get('username') === coll.creator

        const { json_metadata, token_count } = coll

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        return <div className='row'>
            <div className='NFTCollectionPage'>
                <div><h4>{data.title || coll.name}</h4></div>

                <div style={{ overflow: 'auto' }}>
                    <span style={{ display: 'inline-block', marginTop: '8px', marginRight: '3px' }}>
                        <span className='secondary'>
                            {tt('nft_collection_page_jsx.owner_is')}
                        </span>
                    </span>
                    <Link to={'/@' + coll.creator}>@{coll.creator}</Link>
                    {isMy ? <span className='float-right'>
                        <button className='button' onClick={this.showIssue}>{tt('transfer_jsx.issue')}</button>
                        <button disabled={!!token_count} title={token_count ? tt('nft_collections_jsx.tokens_exist') : null}
                            className='button hollow alert' onClick={this.deleteIt}>{tt('g.delete')}</button>
                    </span>  : null}
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                    {items}
                    {next_from ? <div className='load-more' key='load_more'>
                        <center><button className='button hollow small' onClick={
                            e => this.props.fetchNftCollectionTokens(this.props.routeParams.name, next_from, this.sort, this.sortReversed)
                        }>{tt('g.load_more')}</button></center>
                    </div> : null}
                </div>
            </div>

            <Reveal show={showIssue} onHide={this.hideIssue} revealStyle={{ width: '450px' }}>
                <IssueNFTToken
                    onClose={this.hideIssue}
                    issueName={issueName}
                    issueNum={issueNum}
                    fetchState={this.refetch}
                />
            </Reveal>

            <Reveal show={showTransfer} onHide={this.hideTransfer} revealStyle={{ width: '450px' }}>
                <NFTTokenTransfer
                    currentUser={currentUser}
                    onClose={this.hideTransfer}
                    tokenIdx={tokenIdx}
                    refetch={this.refetch}
                />
            </Reveal>

            <Reveal show={showSell} onHide={this.hideSell} revealStyle={{ width: '450px' }}>
                <NFTTokenSell
                    currentUser={currentUser}
                    onClose={this.hideSell}
                    tokenIdx={tokenIdx}
                    refetch={this.refetch}
                />
            </Reveal>

            <Reveal show={showPlaceOfferBet} onHide={this.hidePlaceOfferBet} revealStyle={{ width: '450px' }}>
                <NFTPlaceOfferBet
                    currentUser={currentUser}
                    onClose={this.hidePlaceOfferBet}
                    tokenIdx={tokenIdx}
                    refetch={this.refetch}
                    minPrice={this.state.minPrice}
                />
            </Reveal>

            <Reveal show={showAuction} onHide={this.hideAuction} revealStyle={{ width: '450px' }}>
                <NFTAuction
                    currentUser={currentUser}
                    onClose={this.hideAuction}
                    tokenIdx={tokenIdx}
                    refetch={this.refetch}
                />
            </Reveal>
        </div>
    }
}

module.exports = {
    path: '/nft-collections(/:name)',
    component: connect(
        // mapStateToProps
        (state, ownProps) => {
            const currentUser = state.user.getIn(['current'])

            return { ...ownProps,
                currentUser,
                nft_collection: state.global.get('nft_collection'),
                nft_collection_loaded: state.global.get('nft_collection_loaded'),
                nft_tokens: state.global.get('nft_tokens'),
                nft_assets: state.global.get('nft_assets')
            }
        },

        dispatch => ({
            fetchNftCollectionTokens: (collectionName, start_token_id, sort, sortReversed) => {
                dispatch(g.actions.fetchNftCollectionTokens({ collectionName, start_token_id, sort, reverse_sort: sortReversed }))
            },
            deleteCollection: (
                name, currentUser, successCallback, errorCallback
            ) => {
                const username = currentUser.get('username')
                const operation = {
                    creator: username,
                    name,
                }

                dispatch(transaction.actions.broadcastOperation({
                    type: 'nft_collection_delete',
                    username,
                    operation,
                    successCallback,
                    errorCallback
                }))
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
            }
        })
    )(NFTCollectionPage)
}

