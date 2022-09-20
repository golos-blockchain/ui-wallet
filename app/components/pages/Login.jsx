import React from 'react'

import LoginForm from 'app/components/modules/LoginForm'

class Login extends React.Component {
    render() {
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
