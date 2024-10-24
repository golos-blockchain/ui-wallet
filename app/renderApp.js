import 'whatwg-fetch';
import * as golos from 'golos-lib-js';
import GolosDexApi from 'golos-dex-lib-js'

import './assets/stylesheets/app.scss';
import renderWrapper from 'app/renderWrapper'
import { serverApiRecordEvent } from 'app/utils/ServerApiClient';

// window.onerror = error => {
//     if (window.$STM_csrf) serverApiRecordEvent('client_error', error);
// };

export default async function renderApp(initialState) {
    if (process.env.BROWSER) {
        await golos.importNativeLib();
    }

    const config = initialState.offchain.config
    golos.config.set('websocket', config.ws_connection_client)
    if (config.chain_id)
        golos.config.set('chain_id', config.chain_id)

    try {
        new GolosDexApi(golos, {
            host: config.apidex_service.host
        })
    } catch (err) {
        console.error('Cannot init GolosDexApi', err)
    }

    window.$STM_Config = config;

    if (initialState.offchain.serverBusy) {
        window.$STM_ServerBusy = true;
    }
    if (initialState.offchain.csrf) {
        window.$STM_csrf = initialState.offchain.csrf;
        delete initialState.offchain.csrf;
    }

    try {
        await renderWrapper(initialState)
    } catch (error) {
        console.error(error)
        alert('renderApp ' + error.toString() + '\n' + JSON.stringify(error.stack))
        serverApiRecordEvent('client_error', error)
    }
}
