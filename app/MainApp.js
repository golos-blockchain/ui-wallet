import renderApp from 'app/renderApp'
import golos from 'golos-lib-js'
import tt from 'counterpart'

import { openAppSettings } from 'app/components/pages/app/AppSettings'
import * as api from 'app/utils/APIWrapper'
import { addShortcut } from 'app/utils/app/ShortcutUtils'
import { checkUpdates } from 'app/utils/app/UpdateUtils'
import defaultCfg from 'app/app_cfg'
require('app/cookieHelper')

// Currently it is broken

let appConfig
if (process.env.MOBILE_APP) {
    console.log('Loading app config...')
    let cfg = localStorage.getItem('app_settings')
    if (cfg) {
        try {
            cfg = JSON.parse(cfg)
            // Add here migrations
            cfg = { ...defaultCfg, ...cfg }
        } catch (err) {
            console.error('Cannot parse app_settings', err)
            cfg = defaultCfg
        }
    } else {
        cfg = defaultCfg
    }
    if (!cfg.ws_connection_client) {
        cfg.ws_connection_client = cfg.ws_connection_app[0].address
    }
    if (cfg.images.use_img_proxy === undefined) {
        cfg.images.use_img_proxy = true
    }
    cfg.app_version = defaultCfg.app_version
    appConfig = cfg
} else {
    appConfig = window.appSettings.load()
}

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
    try {
        if (!process.env.MOBILE_APP) {
            window.appSplash.contentLoaded()
        }
    } catch (err) {
        console.error('closeSplash', err)
    }
}

const isSettings = () => {
    return window.location.hash === '#app-settings' ||
        window.location.pathname === '/__app_settings'
}

function showNodeError() {
    if (isSettings()) return
    if (confirm(tt('app_settings.node_error_new_NODE', { NODE: $STM_Config.ws_connection_client })
        + ' ' + tt('app_settings.node_error_new_NODE2') + '?')) {
        openAppSettings()
    }
}

const showError = (err, label = '') => {
    if (!process.env.MOBILE_APP) return
    alert(label + ' error:\n'
        + (err && err.toString()) + '\n'
        + (err && JSON.stringify(err.stack))
    )
}

async function initState() {
    try {
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

        // First add - for case if all failed at all, and not rendering
        if (process.env.MOBILE_APP) {
            await addShortcut({
                id: 'the_settings',
                shortLabel: 'Настройки',
                longLabel: 'Настройки',
                hash: '#app-settings'
            })
        }

        let splashTimeout = setTimeout(() => {
            closeSplash()
            showNodeError()
        }, 60000)

        const doUpdate = Math.random() > 0.5
        if (doUpdate) {
            try {
                const now = Date.now()
                $STM_Config.add_notify_site = await checkUpdates()
            } catch (err) {
                console.error('Cannot check updates', err)
                clearTimeout(splashTimeout)
                closeSplash()
                alert('Cannot check updates:\n' + err)
                //showError(err, 'Cannot check updates')
            }
        }

        let nodeError
        if (!isSettings()) {
            try {
                await golos.api.getAccountsAsync(['null'])
            } catch (err) {
                console.error(err)
                nodeError = err
            }
        }

        clearTimeout(splashTimeout)
        closeSplash()

        if (nodeError) {
            showNodeError()
        }

        return initialState
    } catch (err) {
        if (isSettings()) {
            console.error(err)
            return
        }
        showError(err, 'initState')
    }
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

