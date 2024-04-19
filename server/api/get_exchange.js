import config from 'config'
import { libs } from 'golos-lib-js'

import getExchangeData, { ExchangeTypes } from 'shared/getExchangeData'

export default function useGetExchangeHandler(app) {
    app.get('/get_exchange/:amount/:symbol/:direction?/:e_type?/:min_to_receive?', async (ctx) => {
        const { dex } = libs

        const { amount, symbol, direction, e_type, min_to_receive } = ctx.params
        const eType = ExchangeTypes.fromStr(e_type)
        ctx.body = await getExchangeData({
            dex,
            exNode: () => {
                if (!config.has('ws_connection_exchange')) {
                    throw new Error('No ws_connection_exchange node in config')
                }
                return config.get('ws_connection_exchange')
            },
            callParams: () => ctx.params
        }, amount, symbol, direction, eType, min_to_receive)
    })
}
