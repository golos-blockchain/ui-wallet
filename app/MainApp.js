import renderApp from 'app/renderApp'
import golos from 'golos-lib-js'
import tt from 'counterpart'

import * as api from 'app/utils/APIWrapper'
import { checkUpdates } from './appUpdater'
require('app/cookieHelper')

// Currently it is broken

const appConfig = window.appSettings.load()

const initialState = {
    offchain: {
        config: {
            ...appConfig,
            add_notify_site: {}
        },
        flash: {

        },
    },
}

window.$STM_Config = initialState.offchain.config
window.$STM_csrf = null // not used in app

function closeSplash() {
    if (window.appSplash)
        window.appSplash.contentLoaded()
}

function showNodeError() {
    alert(tt('app_settings.node_error_NODE', { NODE: $STM_Config.ws_connection_client }))
}

async function initState() {
    // these are need for getState
    await golos.importNativeLib();
    const config = initialState.offchain.config
    golos.config.set('websocket', config.ws_connection_client)
    if (config.chain_id)
        golos.config.set('chain_id', config.chain_id)

    const { pathname } = window.location
    if (pathname.startsWith('/__app_')) {
        return initialState
    }

    let splashTimeout = setTimeout(() => {
        closeSplash()
        showNodeError()
    }, 60000)

    try {
        $STM_Config.add_notify_site = await checkUpdates()
    } catch (err) {
        console.error('Cannot check updates', err)
        clearTimeout(splashTimeout)
        closeSplash()
        alert('Cannot check updates' + err)
    }

    let nodeError = null

    clearTimeout(splashTimeout)
    closeSplash()

    if (nodeError) {
        showNodeError()
        throw nodeError
    }

    return initialState
}

initState().then((initialState) => {
    if (!window.Intl) {
        require.ensure(
            ['intl/dist/Intl'],
            (require) => {
                window.IntlPolyfill = window.Intl = require('intl/dist/Intl')
                require('intl/locale-data/jsonp/en-US.js')
                renderApp(initialState)
            },
            'IntlBundle'
        )
    } else {
        renderApp(initialState)
    }
})

