import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'
import { api } from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'
import { Map, } from 'immutable'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'

class TransferWaiter extends React.Component {
    state = {
    }

    constructor(props) {
        super(props)
    }

    start = async () => {
        this.setState({
            seconds: 30*60
        })

        this.countdown = setInterval(() => {
            const { seconds } = this.state
            if (seconds === 0) {
                console.log('Countdown reached, stop.')
                this.stop()
                return
            }
            this.setState({
                seconds: seconds - 1
            })
        }, 1000)

        const { currentUser } = this.props
        const { sym, onTransfer } = this.props
        const username = currentUser.get('username')
        const getBalance = async () => {
            const balances = await api.getAccountsBalancesAsync([username], {
                symbols: [sym]
            })
            let bal = balances[0][sym]
            if (bal) {
                bal = bal.balance
                return Asset(bal)
            } else {
                const assets = await api.getAssetsAsync('', [sym])
                bal = Asset(assets[0].supply)
                bal.amount = 0
                return bal
            }
        }
        try {
            const initBal = await getBalance()
            const pollMsec = process.env.NODE_ENV === 'development' ? 1000 : 30000
            this.pollInterval = setInterval(async () => {
                const bal = await getBalance()
                console.log(initBal.toString(), bal.toString())
                if (bal.amount > initBal.amount) {
                    this.stop()
                    if (onTransfer) {
                        const delta = Asset(bal.amount - initBal.amount, bal.precision, bal.symbol)
                        onTransfer(delta)
                    }
                }
            }, pollMsec)
        } catch (err) {
            console.error(err)
            this.setState({ seconds: undefined })
            this.stop()
        }
    }

    componentDidMount() {
        this.start()
    }

    stop = () => {
        if (this.countdown) clearInterval(this.countdown)
        if (this.pollInterval) clearInterval(this.pollInterval)
    }

    componentWillUnmount() {
        this.stop()
    }

    componentDidUpdate(prevProps) {
        if (this.props.sym !== prevProps.sym) {
            this.stop()
            this.start()
        }
    }

    render() {
        const { seconds } = this.state
        if (!seconds) return null
        const min = Math.floor(seconds / 60)
        const sec = seconds % 60
        const remaining = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
        const { sym, title } = this.props
        return <div align="center" style={{ marginTop: '1rem', }}>
            {title}
            <div style={{ marginTop: '0.5rem', }}>
                <LoadingIndicator type='dots' />
                {remaining}
            </div>
        </div>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {locationBeforeTransitions: {pathname}} = state.routing;
        const currentUserNameFromRoute = pathname.split(`/`)[1].substring(1);
        const currentUserFromRoute = Map({username: currentUserNameFromRoute});
        const currentUser = state.user.getIn(['current']) || currentUserFromRoute;
        return { ...ownProps, currentUser, };
    },

    dispatch => ({
    })
)(TransferWaiter)
