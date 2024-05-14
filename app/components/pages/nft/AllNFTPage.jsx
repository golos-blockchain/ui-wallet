import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'
import Reveal from 'react-foundation-components/lib/global/reveal'

import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTAuction from 'app/components/modules/nft/NFTAuction'
import NFTTokenItem from 'app/components/elements/nft/NFTTokenItem'
import NFTTokenTransfer from 'app/components/modules/nft/NFTTokenTransfer'
import NFTTokenSell from 'app/components/modules/nft/NFTTokenSell'
import NFTPlaceOfferBet from 'app/components/modules/nft/NFTPlaceOfferBet'
import g from 'app/redux/GlobalReducer'

class AllNFTPage extends React.Component {
    state = {}

    componentDidMount() {
        setTimeout(() => {
            this.refetch()
        }, 500)
    }

    refetch = () => {
        this.props.fetchNFTTokens(0, this.sort, this.sortReversed)
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

    sortOrder = (e, sort, sortReversed) => {
        e.preventDefault()
        this.sort = sort
        this.sortReversed = sortReversed
        this.refetch()
    }

    render() {
        const { currentUser, nft_tokens, nft_assets, } = this.props

        const tokens = nft_tokens ? nft_tokens.toJS().data : null
        const assets = nft_assets ? nft_assets.toJS() : {}

        const next_from = nft_tokens && nft_tokens.get('next_from')

        let items = []
        if (!tokens) {
            items = <LoadingIndicator type='circle' />
        } else if (!tokens.length) {
            items = <span>{tt('nft_tokens_jsx.not_yet')}</span>
        } else {
            for (let i = 0; i < tokens.length; ++i) {
                const token = tokens[i]
                items.push(<NFTTokenItem key={i} token={token} tokenIdx={i}
                    assets={assets}
                    showTransfer={this.showTransfer}
                    showSell={this.showSell}
                    showPlaceOfferBet={this.showPlaceOfferBet}
                    showAuction={this.showAuction}
                    refetch={this.refetch} />)
            }
        }

        const { showTransfer, showSell, showAuction, showPlaceOfferBet, tokenIdx } = this.state

        const sortItems = [
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_last_update', false)
            }, value: tt('nft_tokens_jsx.sort_new') },
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_last_update', true)
            }, value: tt('nft_tokens_jsx.sort_old') },
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_last_price', false)
            }, value: tt('nft_tokens_jsx.sort_price') },
            { link: '#', onClick: e => {
                this.sortOrder(e, 'by_name', false)
            }, value: tt('nft_tokens_jsx.sort_name') },
        ]

        let currentSort
        if (this.sort === 'by_last_price') {
            currentSort = tt('nft_tokens_jsx.sort_price')
        } else if (this.sort === 'by_name') {
            currentSort = tt('nft_tokens_jsx.sort_name')
        } else {
            if (this.sortReversed) {
                currentSort = tt('nft_tokens_jsx.sort_old')
            } else {
                currentSort = tt('nft_tokens_jsx.sort_new')
            }
        }

        return (<div className='AllNFTPage'>
            <div className="row">
                <div className="column small-12">
                    <h4 className="Assets__header">{tt('all_nft_page_jsx.title')}</h4>
                    <span className='float-right'>&nbsp;&nbsp;</span>
                    <DropdownMenu className='float-right' el='div' items={sortItems} selected={currentSort}>
                        <span title={tt('nft_tokens_jsx.sort')} style={{ display: 'block', marginTop: '5px' }}>
                            {currentSort}
                            <Icon name='dropdown-arrow' size='0_95x' />
                        </span>
                    </DropdownMenu>
                </div>
            </div>
            <div className="row">
                <div className="column small-12">
                    {items}
                    {next_from ? <div className='load-more' key='load_more'>
                        <center><button className='button hollow small' onClick={
                            e => this.props.fetchNFTTokens(next_from, this.sort, this.sortReversed)
                        }>{tt('g.load_more')}</button></center>
                    </div> : null}
                </div>
            </div>

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
        </div>)
    }
}

module.exports = {
    path: '/all-nft',
    component: connect(
        (state, ownProps) => {
            const currentUser = state.user.getIn(['current'])

            return {
                currentUser,
                nft_tokens: state.global.get('nft_tokens'),
                nft_assets: state.global.get('nft_assets')
            }
        },
        dispatch => ({
            fetchNFTTokens: (start_token_id, sort, sortReversed) => {
                dispatch(g.actions.fetchNftTokens({ account: '', start_token_id, sort, reverse_sort: sortReversed }))
            },
        })
    )(AllNFTPage),
}