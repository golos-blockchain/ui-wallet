import React from 'react'

import LoginForm from 'app/components/modules/LoginForm'
import session from 'app/utils/session'
import { browserHistory } from 'react-router'

class Login extends React.Component {
    state = {}

    componentDidMount() {
        // This logic is for Desktop app, or if server redirect will break
        const current = session.load().currentName
        if (current) {
            browserHistory.push('/@' + current)
        } else {
            this.setState({
                loaded: true
            })
        }
    }

    render() {
        if (!this.state.loaded) {
            return null
        }
        return <div className='Login row'>
            <div
                className='column lock-image'>
                <img src={require('app/assets/images/signer_lock.png')} alt='' />
            </div>
            <div
                className='column'
                style={{ maxWidth: '30rem', margin: '0 auto', paddingTop: '5rem', }}
            >
                <LoginForm afterLoginRedirectToWelcome={true} />
            </div>
        </div>
    }
}

module.exports = {
    path: '/login',
    component: Login
}
