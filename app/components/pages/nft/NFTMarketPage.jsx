import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'

import NFTMarketCollections from 'app/components/elements/nft/NFTMarketCollections'
import g from 'app/redux/GlobalReducer'

class NFTMarketPage extends React.Component {
    componentDidMount() {
        this.props.fetchNftMarketCollections()
    }

    render() {
        const { currentAccount, nft_market_collections, routeParams } = this.props

        const { name } = routeParams

        return <div className='row'>
            <div className='NFTMarketPage'>
                <NFTMarketCollections nft_market_collections={nft_market_collections} selected={name} />
            </div>
        </div>
    }
}

module.exports = {
    path: '/nft(/:name)',
    component: connect(
        (state, ownProps) => {
            const currentUser = state.user.getIn(['current'])
            const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])
            const nft_market_collections = state.global.getIn(['nft_market_collections'])

            return {
                currentAccount,
                nft_market_collections,
            }
        },
        dispatch => ({
            fetchNftMarketCollections: () => {
                dispatch(g.actions.fetchNftMarketCollections({  }))
            },
            fetchNftOrders: (account, collectionName, start_order_id, sort, reverse_sort) => {
                dispatch(g.actions.fetchNftOrders({ account, collectionName, start_order_id, sort, reverse_sort }))
            },
            fetchOwnNftOrders: (account, collectionName, start_order_id, sort, reverse_sort) => {
                dispatch(g.actions.fetchOwnNftOrders({ account, collectionName, start_order_id, sort, reverse_sort }))
            },
            fetchNftMarketTokens: (account, collectionName, start_token_id) => {
                dispatch(g.actions.fetchNftMarketTokens({ account, collectionName, start_token_id }))
            },
        })
    )(NFTMarketPage),
}
