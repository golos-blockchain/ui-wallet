import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { Link } from 'react-router'
import tt from 'counterpart'
import { Map } from 'immutable'
import Reveal from 'react-foundation-components/lib/global/reveal'

import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTTokenItem from 'app/components/elements/nft/NFTTokenItem'
import NFTTokenTransfer from 'app/components/modules/nft/NFTTokenTransfer'
import NFTTokenSell from 'app/components/modules/nft/NFTTokenSell'
import g from 'app/redux/GlobalReducer'

class NFTTokens extends Component {
    state = {}

    constructor() {
        super()
    }

    componentDidMount() {
        if (!this.props.nft_tokens) {
            this.refetch()
        }
    }

    refetch = () => {
        this.props.fetchNFTTokens(this.props.account, 0, this.sort, this.sortReversed)
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

    sortOrder = (e, sort, sortReversed) => {
        e.preventDefault()
        this.sort = sort
        this.sortReversed = sortReversed
        this.refetch()
    }

    render() {
        const { currentUser, account, isMyAccount, nft_tokens, nft_assets, } = this.props
        const accountName = account.get('name')

        const tokens = nft_tokens ? nft_tokens.toJS().data : null
        const assets = nft_assets ? nft_assets.toJS() : {}

        const next_from = nft_tokens && nft_tokens.get('next_from')

        let items = []
        if (!tokens) {
            items = <LoadingIndicator type='circle' />
        } else if (!tokens.length) {
            if (isMyAccount) {
                items = <span>{tt('nft_tokens_jsx.not_yet')}</span>
            } else {
                items = <span>{tt('nft_tokens_jsx.not_yet2') + accountName + tt('nft_tokens_jsx.not_yet3')}</span>
            }
        } else {
            for (let i = 0; i < tokens.length; ++i) {
                const token = tokens[i]
                items.push(<NFTTokenItem key={i} token={token} tokenIdx={i}
                    assets={assets}
                    showTransfer={this.showTransfer}
                    showSell={this.showSell}
                    refetch={this.refetch} />)
            }
        }

        const { showTransfer, showSell, tokenIdx } = this.state

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

        return (<div className='NFTTokens'>
            <div className="row">
                <div className="column small-12">
                    <h4 className="Assets__header">{tt('g.nft_tokens')}</h4>
                    <Link to={`/nft`} className="button float-right">
                        {tt('g.buy')}
                    </Link>
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
                            e => this.props.fetchNFTTokens(this.props.account, next_from, this.sort, this.sortReversed)
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
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        const {locationBeforeTransitions: {pathname}} = state.routing;
        let currentUser = ownProps.currentUser || state.user.getIn(['current']) 
        if (!currentUser) {
            const currentUserNameFromRoute = pathname.split(`/`)[1].substring(1);
            currentUser = Map({username: currentUserNameFromRoute});
        }
        return {...ownProps, currentUser,
            nft_tokens: state.global.get('nft_tokens'),
            nft_assets: state.global.get('nft_assets')
        }
    },
    dispatch => ({
        fetchNFTTokens: (account, start_token_id, sort, sortReversed) => {
            if (!account) return
            dispatch(g.actions.fetchNftTokens({ account: account.get('name'), start_token_id, sort, reverse_sort: sortReversed }))
        },
    })
)(NFTTokens)
