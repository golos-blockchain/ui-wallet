import React from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'

import user from 'app/redux/User'
import { reloadLocation } from 'app/utils/app/RoutingUtils'

class FinishedOrder extends React.Component {
    resetConvert = (e) => {
        e.preventDefault()
        const { isDialog } = this.props
        if (isDialog) {
            this.props.resetConvert()
            return
        }
        reloadLocation()
    }

    render() {
        const { finished, finishedAcc, buyAmount, sellAmount, remainToReceive } = this.props
        const path = buyAmount.isUIA ? 'assets' : 'transfers'
        const link = <a href={`/@${finishedAcc}/${path}`}>
            <b>{tt('convert_assets_jsx.finished_balance')}</b>
        </a>
        const goCancel = (e) => {
            e.preventDefault()
            this.props.showOpenOrders({ sym: sellAmount.symbol })
        }
        const cancelLink = <a href='#' onClick={goCancel}>{tt('convert_assets_jsx.partly_link')}</a>

        const resetLink = <div style={{ marginTop: '0.5rem' }} className={finished !== 'full' ? 'secondary' : ''}>
            {tt('convert_assets_jsx.also_you_can')}
            <a href='#' onClick={this.resetConvert}>
                {tt('convert_assets_jsx.reset_convert')}
            </a>.
        </div>

        if (finished === 'full') {
            return (<div className='ConvertAssets'>
                    <center>
                    <h3>{tt('convert_assets_jsx.finished')}</h3>
                    <img src={require('app/assets/images/swap.png')} alt='' />
                    <br /><br />
                    {tt('convert_assets_jsx.finished_desc')} {link}.
                    {resetLink}
                    </center>
                </div>)
        } else if (finished === 'not') {
            return (<div className='ConvertAssets'>
                    <h3>{tt('convert_assets_jsx.not')}</h3>
                    <div>
                        {tt('convert_assets_jsx.not_desc')}
                        {cancelLink}.
                    </div>
                    {resetLink}
                </div>)
        } else {
            return (<div className='ConvertAssets'>
                    <h3>{tt('convert_assets_jsx.partly')}</h3>
                    <div>
                        {tt('convert_assets_jsx.partly_desc')}
                        {remainToReceive.floatString}
                        {tt('convert_assets_jsx.partly_desc2')}
                        {cancelLink}.
                        {tt('convert_assets_jsx.partly_desc3')}
                        {link}.
                    </div>
                    {resetLink}
                </div>)
        }
    }
}

export default connect(
    null,
    dispatch => ({
        showOpenOrders: defaults => {
            dispatch(user.actions.setOpenOrdersDefaults(defaults))
            dispatch(user.actions.showOpenOrders())
            dispatch(user.actions.hideConvertAssets())
        },
        resetConvert: defaults => {
            const res = dispatch(user.actions.hideConvertAssets())
            setTimeout(() => {
                dispatch(user.actions.showConvertAssets())
            }, 10)
        },
    })
)(FinishedOrder)
