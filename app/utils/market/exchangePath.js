import { fetchEx } from 'golos-lib-js/lib/utils'

import { getExchangePath } from 'shared/getExchangeData'

export async function checkExchangePath(buy, keys) {
    if (!process.env.IS_APP) {
        const url = '/api/v1/get_exchange_path/' + buy + '/' + keys.join(',')
        let resp = await fetchEx(url, {})
        resp = await resp.json()
        if (resp.err) {
            throw new Error(resp.err)
        }
        return resp
    }

    if (!$STM_Config.ws_connection_exchange) {
        throw new Error('getExchangePath - No ws_connection_exchange in config')
    }
    return await getExchangePath(buy, keys, $STM_Config.ws_connection_exchange)
}
