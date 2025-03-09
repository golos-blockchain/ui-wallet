import { Asset, Price } from 'golos-lib-js/lib/utils'
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

// works like apidexExchange result
const wrapDir = (resMul) => { 
    const { direct } = resMul
    const { steps, best_price, limit_price } = direct
    if (!steps) {
        return { error: 'no_orders' }
    }

    const res = {}
    res.result = Asset(direct.res)
    res.limit_price = Price(Asset(limit_price.quote), Asset(limit_price.base))
    res.best_price = Price(Asset(best_price.quote), Asset(best_price.base))
    if (steps[0].remain) {
        res.remain = Asset(steps[0].remain)
    }

    return res
}

export default async function getExchangeData(endpoint,
	amount, symbol, direction = 'sell', eType = ExchangeTypes.direct,
	min_to_receive = null) {
	const { dex, exNode, callParams } = endpoint
	try {
        let resDir

        let mtr = {}
        if (min_to_receive) {
            mtr = {
                multi: min_to_receive
            }
        } else {
            if (direction === 'buy') {
                const multi = Asset(amount)
                let lesser = multi.mul(100 - MIN_PROFIT_PCT).div(100)
                if (lesser.eq(0)) lesser.amount = 1
                mtr.multi = lesser
            } else if (eType === ExchangeTypes.direct) {
                mtr.min_profit_pct = MIN_PROFIT_PCT
            }
        }

        let resMul, errMul
        if (Asset(amount).gt(0)) {
            try {
                resMul = await dex.getExchange({
                    node: exNode ? exNode() : undefined,

                    amount,
                    direction,
                    symbol,
                    hybrid: {
                        strategy: 'spread',
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

            try {
                resDir = wrapDir(resMul)
            } catch (err) {
                console.error('Cannot obtain direct chain from getExchange response', err)
                resDir = await dex.apidexExchange({
                    sell: amount,
                    buySym: symbol,
                    direction,
                })
                console.log('...correct res is', resDir)
            }
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
