import React from 'react'
import tt from 'counterpart'
import { connect } from 'react-redux'
import Button from '@elements/Button';

import user from 'app/redux/User'

class LeaveGolos extends React.Component {
    hideMe = () => {
        this.props.hideLeaveGolos()
    }

    leaveOut = () => {
        this.hideMe()
        const { url } = this.props
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    render() {
        const { url } = this.props

        const spans = []
        try {
            const parsed = new URL(url)
            const opacity = 0.5
            spans.push(<b key='protocol' style={{ opacity }}>{parsed.protocol + '//'}</b>)
            spans.push(<b key='host'>{parsed.host}</b>)
            spans.push(<b key='other' style={{ opacity }}>{parsed.pathname + parsed.search + parsed.hash}</b>)
        } catch (err) {
            spans.push(<b key='url'>{url}</b>)
        }

        return <div>
            <h4>{tt('leave_golos_jsx.title')}</h4>
            <p>{tt('leave_golos_jsx.desc1')}</p>
            <p>{spans}</p>
            <p>{tt('leave_golos_jsx.desc2')}</p>
            <div>
                <Button onClick={this.leaveOut} round>
                    {tt('leave_golos_jsx.go')}
                </Button>
                <Button onClick={this.hideMe} round type='secondary'>
                    {tt('leave_golos_jsx.cancel')}
                </Button>
            </div>
        </div>
    }
}

export default connect(
    (state, props) => {
        const defaults = state.user.get('leave_golos_defaults').toJS()
        const { url } = defaults
        return {
            ...props,
            url,
        };
    },
    dispatch => ({
        hideLeaveGolos: () => {
            dispatch(user.actions.hideLeaveGolos())
        }
    })
)(LeaveGolos)
