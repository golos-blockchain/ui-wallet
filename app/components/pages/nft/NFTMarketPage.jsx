import React from 'react'
import { connect, } from 'react-redux'
import { Link } from 'react-router'
import tt from 'counterpart'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTTokenItem from 'app/components/elements/nft/NFTTokenItem'
import g from 'app/redux/GlobalReducer'
import session from 'app/utils/session'

class NFTMarketPage extends React.Component {
    componentDidMount() {
        this.refetch()
    }

    refetch = () => {
        const curName = session.load().currentName
        this.props.fetchNftMarket(curName, '', 0, this.sort, this.sortReversed)
    }

    render() {
        const { currentUser, nft_orders, own_nft_orders, nft_assets, routeParams } = this.props

        const { name } = routeParams

        let content
        const orders = nft_orders ? nft_orders.toJS().data : null
        const own_orders = own_nft_orders ? own_nft_orders.toJS().data : null
        const assets = nft_assets ? nft_assets.toJS() : {}

        const next_from = nft_orders && nft_orders.get('next_from')

        if (!orders || !own_orders) {
            content = <LoadingIndicator type='circle' />
        } else {
            let items = []
            if (!orders.length) {
                items = tt('nft_market_page_jsx.no_orders')
            } else {
                for (let i = 0; i < orders.length; ++i) {
                    const order = orders[i]
                    items.push(<NFTTokenItem key={i} token={order.token} tokenOrder={order} tokenIdx={i}
                        assets={assets}
                        refetch={this.refetch}
                        page='market' />)
                }
            }

            let ownItems = []
            if (!own_orders.length) {
                ownItems = tt('nft_market_page_jsx.no_own_orders')
            } else {
                for (let i = 0; i < own_orders.length; ++i) {
                    const order = own_orders[i]
                    ownItems.push(<NFTTokenItem key={i} token={order.token} tokenOrder={order} tokenIdx={i}
                        assets={assets}
                        refetch={this.refetch} />)
                }
            }

            const username = currentUser && currentUser.get('username')

            content = <div>
                {items}
                {next_from ? <div className='load-more' key='load_more'>
                    <center><button className='button hollow small' onClick={
                        e => this.props.fetchNftMarket(username, '', next_from, this.sort, this.sortReversed)
                    }>{tt('g.load_more')}</button></center>
                </div> : null}
                <hr/>
                <h4>{tt('nft_market_page_jsx.own_orders')}</h4>
                {ownItems}
            </div>
        }

        return <div className='row'>
            <div className='NFTMarketPage'>
                <div style={{ marginTop: '0.25rem' }}>
                    <h4 style={{ display: 'inline-block' }}>{tt('header_jsx.nft_market')}</h4>
                    <Link to={`/all-nft`} className="button hollow float-right">
                        {tt('all_nft_page_jsx.title')}
                    </Link>
                </div>
                {content}
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

            const nft_orders = state.global.get('nft_orders')
            const own_nft_orders = state.global.get('own_nft_orders')

            return {
                currentUser,
                currentAccount,
                nft_orders,
                own_nft_orders,
                nft_assets: state.global.get('nft_assets')
            }
        },
        dispatch => ({
            fetchNftMarket: (account, collectionName, start_order_id, sort, reverse_sort) => {
                dispatch(g.actions.fetchNftMarket({ account, collectionName, start_order_id, sort, reverse_sort }))
            },
        })
    )(NFTMarketPage),
}
