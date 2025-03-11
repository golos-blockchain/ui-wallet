import config from 'config'
import { libs } from 'golos-lib-js'

import getExchangeData, { getExchangePath, ExchangeTypes } from 'shared/getExchangeData'

export default function useGetExchangeHandler(app) {
    app.get('/get_exchange/:amount/:symbol/:direction?/:e_type?', async (ctx) => {
        const { dex } = libs

        const { amount, symbol, direction, e_type, } = ctx.params
        const { min_to_receive, strategy } = ctx.query
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
        }, amount, symbol, direction, eType, min_to_receive, strategy)
    })

    app.get('/get_exchange_path/:buy/:keys', async (ctx) => {
        try {
            let { buy, keys } = ctx.params
            keys = keys.split(',')
            ctx.body = await getExchangePath(buy, keys, config.get('ws_connection_exchange'))
        } catch (err) {
            ctx.body = {
                err: ((err && err.toString) ? err.toString() : err)
            }
        }
    })
}
