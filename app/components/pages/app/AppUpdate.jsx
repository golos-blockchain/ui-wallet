import React from 'react'
import tt from 'counterpart'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { getChangelog } from 'app/utils/app/UpdateUtils'

class AppUpdate extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: true,
        }
    }

    appUpdaterUrl = (file) => {
        let url
        if (process.env.MOBILE_APP) {
            url = new URL(
                '/wallet-android/' + file,
                $STM_Config.app_updater.host
            )
        } else {
            url = new URL(
                '/desktop-' + ($STM_Config.platform === 'linux' ? 'linux' : 'windows') + '/' + file,
                $STM_Config.app_updater.host
            )
        }
        return url.toString()
    }

   async componentDidMount() {
        try {
            let params = new URLSearchParams(window.location.search)
            const v = params.get('v')
            const exe = params.get('exe')
            const txt = params.get('txt')

            const exeUrl = this.appUpdaterUrl(exe)
            const txtUrl = this.appUpdaterUrl(txt)

            this.setState({
                v,
                exeUrl
            })

            let res = await getChangelog(txtUrl)

            this.setState({
                description: res,
                loading: false
            })
        } catch (error) {
            console.error(error)
            this.setState({
                loading: false,
                error
            })
        }
    }

    goDownload = (e) => {
        e.preventDefault()
        if (process.env.MOBILE_APP) {
            window.location.href = new URL('/api/exe/wallet/android/latest', $STM_Config.app_updater.host).toString()
            return
        }
        window.open(this.state.exeUrl, '_blank')
    }

    render() {
        const { loading, v, description, error } = this.state
        if (loading) {
            return <center style={{ paddingTop: '5rem' }}>
                    <LoadingIndicator type='circle' size='25px' />
                </center>
        }
        if (error) {
            return <code>{error.toString()}</code>
        }
        return <div style={{ padding: '2rem' }}>
                <h2>GOLOS {process.env.MOBILE_APP ? 'Wallet' : 'Blogs'} - {v}</h2>
                <hr />
                <div style={{ whiteSpace: 'pre-line' }}>
                    {description}
                </div>
                <div>
                    <a href='#' onClick={this.goDownload}>
                        <button type='button' className='button' style={{ marginTop: '1rem' }}>
                            {tt('app_update.download')}
                        </button>
                    </a>
                </div>
            </div>
    }
}

module.exports = {
    path: '/__app_update',
    component: AppUpdate,
}
