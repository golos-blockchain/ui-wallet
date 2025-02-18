import { Asset } from 'golos-lib-js/lib/utils'
import { api } from 'golos-lib-js'

export const MIN_PROFIT_PCT = 5

export const ExchangeTypes = {
    direct: 1,
    multi: 2,

    fromStr: (str) => {
        if (str === 'direct') return ExchangeTypes.direct
        if (str === 'multi') return ExchangeTypes.multi
        throw new Error('Wrong ExchangeType')
    }
}

export default async function getExchangeData(endpoint,
	amount, symbol, direction = 'sell', eType = ExchangeTypes.direct,
	min_to_receive = null) {
	const { dex, exNode, callParams } = endpoint
	try {
        let resDir
        resDir = await dex.apidexExchange({
            sell: amount,
            buySym: symbol,
            direction,
        })

        let resCurr
        if (resDir && resDir.result && eType == ExchangeTypes.direct) {
            resCurr = resDir.result.clone()
        }

        let mtr = {}
        if (min_to_receive) {
            mtr = {
                multi: min_to_receive
            }
        } else {
            if (direction === 'sell') {
                if (resCurr) {
                    const multi = resCurr.clone()
                    let more = multi.mul(100 + MIN_PROFIT_PCT).div(100)
                    if (more.eq(multi)) more = more.plus(1)
                    mtr.multi = more
                }
            } else {
                const multi = Asset(amount)
                let lesser = multi.mul(100 - MIN_PROFIT_PCT).div(100)
                if (lesser.eq(0)) lesser.amount = 1
                mtr.multi = lesser
            }
        }

        let resMul, errMul
        try {
            resMul = await dex.getExchange({
                node: exNode ? exNode() : undefined,

                amount,
                direction,
                symbol,
                hybrid: {
                    strategy: 'discrete',
                },
                remain: {
                    multi: 'ignore'
                },
                min_to_receive: mtr
            })
        } catch (err) {
            console.error('Multi-step getExchange error:', err)
            errMul = err.toString()
        }

        return {
            status: 'ok',
            direct: resDir,
            multi: resMul || null,
            multi_error: errMul
        }
    } catch (err) {
        console.error('get_exchange REST fail:', err, callParams && callParams())
        return {
            status: 'err',
            error: err && err.message
        }
    }
}

export async function getExchangePath(buy, keys, node) {
    const eapi = new api.Golos()
    eapi.setWebSocket(node)
    const path = await eapi.getExchangePathAsync({
        buy,
        select_syms: keys,
        assets: true,
    })
    return path
}
