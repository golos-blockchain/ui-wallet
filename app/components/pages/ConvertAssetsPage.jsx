import React from 'react'
import { connect, } from 'react-redux'
import tt from 'counterpart'

import ConvertAssets from 'app/components/modules/ConvertAssets'
import QuickBuy from 'app/components/modules/QuickBuy'
import session from 'app/utils/session'

class ConvertAssetsPage extends React.Component {
    render() {
        const { currentAccount, routeParams } = this.props
        if (!process.env.BROWSER || (!currentAccount && !session.load().currentName)) {
            return <div style={{ padding: '2rem', textAlign: 'center' }}><h4>{tt('convert_assets_jsx.please_authorize')}</h4></div>
        }
        const params = new URLSearchParams(window.location.search)
        
        let step
        if (params.has('buy')) {
            const { sym1, sym2 } = routeParams
            step = <QuickBuy sym1={sym1} sym2={sym2} />
        } else {
            step = <ConvertAssets routeParams={routeParams} />
        }
        return (<div>
                <div style={{ padding: '1rem', maxWidth: '50rem', margin: 'auto' }}>
                    {step}
                </div>
            </div>)
    }
}

module.exports = {
    path: '/convert(/:sym1)(/:sym2)',
    component: connect(
        (state, ownProps) => {
            const currentUser = state.user.getIn(['current'])
            const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

            return {
                currentAccount,
            }
        },
        dispatch => ({
        })
    )(ConvertAssetsPage),
}
