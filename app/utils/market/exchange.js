import { api } from 'golos-lib-js'
import { Asset, Price } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'
import isEqual from 'lodash/isEqual'

import { apidexExchange } from 'app/utils/ApidexApiClient'

const MIN_PROFIT_PCT = 10

export const ExchangeTypes = {
    direct: 1,
    multi: 2
}

function exchangeApi() {
    const node = $STM_Config.ws_connection_exchange
    if (!node) {
        throw new Error('No exchange node')
        return
    }

    const eapi = new api.Golos()
    eapi.setWebSocket(node)
    return eapi
}

function betterChain(resMul) {
    const { best, direct } = resMul
    return (best && (!direct || !isEqual(direct.syms, best.syms))) && best
}

export async function getExchange(sellAmount, buyAmount, myBalance,
    onData = undefined,
    selected = ExchangeTypes.direct, isSell = true
) {
    const req = isSell ? sellAmount.clone() : buyAmount.clone()
    const isDir = selected == ExchangeTypes.direct 

    let res = isSell ? buyAmount.clone() : sellAmount.clone()
    res.amount = 0

    let limitPrice = null
    let bestPrice = null
    let fee

    let warning = ''
    let amDir, amMul
    let chain
    let altBanner = null

    let resDir = await apidexExchange(req,
        (isSell ? buyAmount.symbol : sellAmount.symbol),
        isSell ? 'sell' : 'buy'
    )

    if (resDir) {
        if (resDir.error) {
            if (isDir) {
                warning = tt('convert_assets_jsx.no_orders_DIRECTION', {
                    DIRECTION: sellAmount.symbol + '/' + buyAmount.symbol
                })
            }
        } else {
            const bp = resDir.best_price.clone()
            if (isDir) {
                bestPrice = bp
                limitPrice = resDir.limit_price.clone()
            }
            amDir = resDir.result.clone()
            const remain = resDir.remain

            if (amDir.amount == 0) {
                amDir.amount = 1
                if (isDir) {
                    warning = tt('convert_assets_jsx.too_low_amount')
                }
            } else if (!isSell && amDir.gt(myBalance)) {
                amDir.amount = myBalance.amount
                if (isDir) {
                    limitPrice = Price(req, res)
                    warning = tt('convert_assets_jsx.too_big_price')
                }
            } else if (remain) {
                if (isDir) {
                    warning = {
                        a1: (isSell ? sellAmount : buyAmount).minus(remain).floatString,
                        a2: amDir.floatString,
                        remain: remain.floatString,
                        isSell
                    }
                }
                if (!isSell) {
                    amDir = amDir.plus(req.mul(bp))
                }
            }

            if (isDir) {
                res = amDir
            }
        }
    }

    let resMul, reqFixed

    try {
        const eapi = exchangeApi()

        const min_to_receive = {}
        if (isSell) {
            const multi = res.clone()
            let more = multi.mul(100 + MIN_PROFIT_PCT).div(100)
            if (more.eq(multi)) more = more.plus(1)
            min_to_receive.multi = more
        } else {
            const multi = req.clone()
            let lesser = multi.mul(100 - MIN_PROFIT_PCT).div(100)
            if (lesser.eq(0)) lesser.amount = 1
            min_to_receive.multi = lesser
        }

        resMul = await eapi.getExchange({
            amount: req.toString(),
            direction: isSell ? 'sell' : 'buy',
            symbol: res.symbol,
            remain: {
                multi: 'ignore'
            },
            min_to_receive
        })
    } catch (err) {
        console.error('Multi-step getExchange', err)
    }

    if (resMul) {
        console.log('ex:', JSON.stringify(resMul))

        chain = betterChain(resMul)

        if (!chain) {
            if (!isDir) {
                warning =  tt('convert_assets_jsx.no_orders_DIRECTION', {
                    DIRECTION: sellAmount.symbol + '/' + buyAmount.symbol
                })
            }
        } else {
            const step = chain.steps[0]
            const bp = Price(step.best_price)
            if (!isDir) {
                bestPrice = bp
                limitPrice = Price(step.limit_price)
            }
            amMul = Asset(chain.res)
            const remain = step.remain ? Asset(step.remain) : undefined
            if (!isSell) {
                reqFixed = Asset(chain.steps[chain.steps.length - 1].receive)
            }

            if (amMul.amount == 0) {
                amMul.amount = 1
                if (!isDir) {
                    warning = tt('convert_assets_jsx.too_low_amount')
                }
            } else if (!isSell && amMul.gt(myBalance)) {
                amMul.amount = myBalance.amount
                if (!isDir) {
                    limitPrice = Price(req, amMul)
                    warning = tt('convert_assets_jsx.too_big_price')
                }
            } else if (remain) {
                if (isDir) {
                    warning = {
                        a1: (isSell ? sellAmount : buyAmount).minus(remain).floatString,
                        a2: amMul.floatString,
                        remain: remain.floatString,
                        isSell
                    }
                }
                if (!isSell) {
                    amMul = amMul.plus(req.mul(bp))
                }
            }

            if (!isDir) {
                res = amMul

                if (isSell) {
                    fee = chain.steps[chain.steps.length - 1].fee
                } else {
                    fee = step.fee
                }
                if (fee) {
                    fee = Asset(fee)
                } else {
                    fee = Asset(0, buyAmount.precision, buyAmount.symbol)
                }
            }
        }
    }

    const showAlt = (amCurrent, amBetter) => {
        if (amBetter) {
            if (!amCurrent) {
                return true
            } else {
                if (isSell) {
                    const more = amCurrent.mul(100 + MIN_PROFIT_PCT).div(100)
                    if (amBetter.gte(more)) return true
                } else {
                    const lesser = amCurrent.mul(100 - MIN_PROFIT_PCT).div(100)
                    if (amBetter.lte(lesser)) return true
                }
            }
        }
        return false
    }
    const showAltBanner = isDir ? showAlt(
        amDir, amMul
    ) : true
    if (showAltBanner) {
        if (isDir) {
            altBanner = { isSell, chain,
                sell: (isSell ? req : amMul),
                buy: (isSell ? amMul : reqFixed),
                req
            }
        } else {
            altBanner = { isSell, direct: true,
                sell: (isSell ? req : amDir),
                buy: (isSell ? amDir : req),
                req
            }
        }
    }

    if (onData) {
        console.log('ab', altBanner)
        onData({
            warning,

            bestPrice,
            limitPrice,

            chain: isDir ? null : chain,
            fee,
            reqFixed,

            altBanner
        })
    }

    return res
}