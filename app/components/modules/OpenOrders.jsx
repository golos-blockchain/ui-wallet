import React, { Component, } from 'react';
import tt from 'counterpart';
import { connect, } from 'react-redux';
import { Link, } from 'react-router';
import { Map, } from 'immutable';
import { api, } from 'golos-lib-js';
import { Asset, } from 'golos-lib-js/lib/utils';
import transaction from 'app/redux/Transaction';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';

class OpenOrders extends Component {
    state = {
        orders: [],
        loading: true,
    };

    load = async () => {
        this.setState({
            orders: [],
            loading: true,
        })
        const { sym, currentUser, } = this.props;
        let pair = [sym, ''];
        try {
            const orders = await api.getOpenOrdersAsync(currentUser.get('username'),
                pair);
            this.setState({
                orders,
                loading: false,
            });
        } catch (err) {
            console.error(err);
        }
    }

    async componentDidMount() {
        this.load();
    }

    cancelClick = (e, orderid) => {
        e.preventDefault();
        const { cancelOrder, sym, currentUser, } = this.props;
        let user = '';
        if (currentUser) {
            user = currentUser.get('username');
        }

        if (!user) {
            return;
        }

        cancelOrder(user, orderid, sym, msg => {
            this.props.notify(msg);
            this.load();
        });
    };

    render() {
        const { sym, currentUser, } = this.props;
        const { orders, loading, } = this.state;
        let name = '';
        if (currentUser) {
            name = currentUser.get('username');
        }
        if (loading) {
            return (<div>
                    <LoadingIndicator type='circle' size='20px' />
                </div>);
        }
        let orderData = [];
        for (let order of orders) {
            let buy = Asset(order.asset1)
            let sell = Asset(order.asset2)
            if (sell.symbol !== sym) {
                [buy, sell] = [sell, buy]
            }

            const sym2 = buy.symbol

            orderData.push(<tr>
                <td>
                    <Link to={'/market/' + sym + '/' + sym2}>
                        {sym + '/' + sym2}
                    </Link>
                </td>
                <td>
                    {sell.toString().split(' ')[0]}
                </td>
                <td>
                    {buy.toString()}
                </td>
                <td style={{ textAlign: 'right', }}>
                    <a
                        href="#"
                        onClick={e => this.cancelClick(e, order.orderid)}
                    >
                        {tt('g.cancel')}
                    </a>
                </td>
            </tr>)
        }
        return (<div>
            <h4>
                {tt('market_jsx.sell_orders')}{' '}{sym}
            </h4>
            <table>
                <thead>
                    <th>{tt('market_jsx.market_pair')}</th>
                    <th>{sym}</th>
                    <th>{tt('invites_jsx.amount')}</th>
                    <th style={{ textAlign: 'right', }}>{tt('market_jsx.action')}</th>
                </thead>
                <tbody>
                    {orderData}
                </tbody>
            </table>
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {locationBeforeTransitions: {pathname}} = state.routing;
        const currentUserNameFromRoute = pathname.split(`/`)[1].substring(1);
        const currentUserFromRoute = Map({username: currentUserNameFromRoute});
        const currentUser = state.user.getIn(['current']) || currentUserFromRoute;
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')]);

        const defaults = state.user.get('open_orders_defaults', Map()).toJS();

        return { ...ownProps, currentUser, currentAccount, sym: defaults.sym, };
    },

    dispatch => ({
        notify: message => {
            dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    key: 'mkt_' + Date.now(),
                    message: message,
                    dismissAfter: 5000,
                },
            });
        },
        cancelOrder: (owner, orderid, sym, successCallback) => {
            const confirm = tt('market_jsx.order_cancel_confirm', {
                order_id: orderid,
                user: owner,
            });

            const successMessage = tt('market_jsx.order_cancelled', {
                order_id: orderid,
            });

            const isUIA = sym !== 'GOLOS' && sym !== 'GBG';

            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_cancel',
                    operation: {
                        owner,
                        orderid,
                    },
                    username: owner,
                    //confirm,
                    successCallback: () => {
                        successCallback(successMessage);
                        let pathname = '';
                        if (!isUIA) {
                            pathname = `@${owner}/transfers`;
                        } else {
                            pathname = `@${owner}/assets`;
                        }
                        dispatch({type: 'FETCH_STATE', payload: {pathname}});
                    },
                    //successCallback
                })
            );
        },
    })
)(OpenOrders)
