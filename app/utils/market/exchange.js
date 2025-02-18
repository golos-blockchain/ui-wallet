import { api, libs } from 'golos-lib-js'
import { Asset, _Asset, Price, _Price, fetchEx } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'
import isEqual from 'lodash/isEqual'
import throttle from 'lodash/throttle'

import getExchangeData, { MIN_PROFIT_PCT, ExchangeTypes } from 'shared/getExchangeData'

export const ExchangeErrors = {
    unavailable: 1,
    no_way: 2,
}

function betterChain(resMul) {
    const { best, direct } = resMul
    return (best && (!direct || !isEqual(direct.syms, best.syms))) && best
}

const wrapAsset = (asset) => {
    return (asset instanceof _Asset) ? asset : Asset(asset)
}

const wrapPrice = (price) => {
    return (price instanceof _Price) ? price : Price(price)
}

export async function getExchangeRaw(sellAmount, buyAmount, myBalance,
    onData = undefined,
    selected = ExchangeTypes.direct, isSell = true
) {
    const req = isSell ? sellAmount.clone() : buyAmount.clone()
    let isDir = selected == ExchangeTypes.direct 
    let newSelected

    let res = isSell ? buyAmount.clone() : sellAmount.clone()
    res.amount = 0
    let resMul, resDir

    let limitPrice = null
    let bestPrice = null
    let fee

    let amDir, amMul
    let warDir, warMul
    let chain
    let directErr, multiErr
    let altBanner = null, mainBanner = null

    console.time('comb')
    if (!process.env.IS_APP) {
        try {
            const selectedStr = selected === ExchangeTypes.direct ? 'direct' : 'multi'
            const url = '/api/v1/get_exchange/' + req.toString() + '/' + res.symbol + '/'
                + (isSell ? 'sell' : 'buy') + '/' + selectedStr
            let resp = await fetchEx(url, {})
            resp = await resp.json()
            resDir = resp.direct
            resMul = resp.multi
            if (resp.multi_error) multiErr = resp.multi_error
        } catch (err) {
            console.error('Request to backend get_exchange err:', err)
        }
    } else {
        try {
            const resp = await getExchangeData({
                    dex: libs.dex,
                    exNode: () => {
                        const node = $STM_Config.ws_connection_exchange
                        if (!node) throw new Error('No ws_connection_exchange')
                        return node
                    }, callParams: () => {
                        return {req, res, isSell, selected}
                    }
                },
                req.toString(), res.symbol,
                (isSell ? 'sell' : 'buy'), selected)
            resDir = resp.direct
            resMul = resp.multi
            if (resp.multi_error) multiErr = resp.multi_error
        } catch (err) {
            console.error('getExchangeData err:', err)
        }
    }
    console.timeEnd('comb')

    // resDir = null if apidex is down
    if (resDir) { 
        if (resDir.error) {
            if (isDir) {
                warDir = tt('convert_assets_jsx.no_orders_DIRECTION', {
                    DIRECTION: sellAmount.symbol + '/' + buyAmount.symbol
                })
                isDir = false
                selected = ExchangeTypes.multi
                newSelected = selected
            }
        } else {
            const bp = wrapPrice(resDir.best_price)
            if (isDir) {
                bestPrice = bp
                limitPrice = wrapPrice(resDir.limit_price)
            }
            amDir = wrapAsset(resDir.result)
            const remain = resDir.remain && wrapAsset(resDir.remain)

            if (amDir.amount == 0) {
                amDir.amount = 1
                if (isDir) {
                    warDir = tt('convert_assets_jsx.too_low_amount')
                }
            } else if (myBalance && !isSell && amDir.gt(myBalance)) {
                amDir.amount = myBalance.amount
                if (isDir) {
                    limitPrice = Price(req, amDir)
                    warDir = tt('convert_assets_jsx.too_big_price')
                }
            } else if (remain) {
                if (isDir) {
                    warDir = {
                        a1: (isSell ? sellAmount : buyAmount).minus(remain).floatString,
                        a2: amDir.floatString,
                        remain: remain.floatString
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
    } else {
        directErr = true
        if (isDir) {
            isDir = false
            selected = ExchangeTypes.multi
            newSelected = selected
        }
    }

    let reqFixed

    if (resMul) {
        chain = betterChain(resMul)

        if (!chain) {
            if (!isDir) {
                warMul =  tt('convert_assets_jsx.no_orders_DIRECTION', {
                    DIRECTION: sellAmount.symbol + '/' + buyAmount.symbol
                })
            }
        } else {
            const step = chain.steps[0]
            const bp = Price(chain.best_price)
            if (!isDir) {
                bestPrice = bp
                limitPrice = Price(chain.limit_price)
            }
            amMul = Asset(chain.res)
            const remain = step.remain ? Asset(step.remain) : undefined
            if (!isSell) {
                reqFixed = Asset(chain.steps[chain.steps.length - 1].receive)
                const { subchains } = chain
                if (subchains && subchains[0]) {
                    const subRec = Asset(subchains[0].steps[0].receive)
                    reqFixed = reqFixed.plus(subRec)
                }
            }

            if (amMul.amount == 0) {
                amMul.amount = 1
                if (!isDir) {
                    warnMul = tt('convert_assets_jsx.too_low_amount')
                }
            } else if (myBalance && !isSell && amMul.gt(myBalance)) {
                amMul.amount = myBalance.amount
                if (!isDir) {
                    limitPrice = Price(req, amMul)
                    warMul = tt('convert_assets_jsx.too_big_price')
                }
            } else if (remain) {
                if (isDir) {
                    warMul = {
                        a1: (isSell ? sellAmount : buyAmount).minus(remain).floatString,
                        a2: amMul.floatString,
                        remain: remain.floatString
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

    if ((!resMul || !chain) && !isDir) {
        isDir = true
        if (amDir) res = amDir
        selected = ExchangeTypes.direct
        newSelected = selected
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
    const multiBanner = () => {
        if (!amMul) {
            return {
                direct: !isDir,
                msg: multiErr ? ExchangeErrors.unavailable : ExchangeErrors.no_way
            }
        }
        return { chain,
            sell: (isSell ? req : amMul),
            buy: (isSell ? amMul : reqFixed),
            req
        }
    }
    const dirBanner = () => {
        if (!amDir) {
            return {
                direct: !isDir,
                msg: directErr ? ExchangeErrors.unavailable : ExchangeErrors.no_way
            }
        }
        return {  direct: true,
            sell: (isSell ? req : amDir),
            buy: (isSell ? amDir : req),
            req
        }
    }

    if (isDir) {
        altBanner = multiBanner()
        mainBanner = dirBanner()
    } else {
        altBanner = dirBanner()
        mainBanner = multiBanner()
    }

    let bestType = ExchangeTypes.direct
    if (showAlt(amDir, amMul)) {
        bestType = ExchangeTypes.multi
    }

    if (onData) {
        onData({
            warning: isDir ? warDir : warMul,

            bestPrice,
            limitPrice,

            chain: isDir ? null : chain,
            fee,
            reqFixed,

            isSell,
            altBanner,
            mainBanner,
            newSelected,
            bestType
        }, res) // `res` for throttle() correct result
    }

    return res
}

const getExchangeLimited = throttle(getExchangeRaw, 250)

let progressTimer

export async function getExchange(sellAmount, buyAmount, myBalance,
    onData = undefined, onProgress = undefined,
    selected = ExchangeTypes.direct, isSell = true
) {
    clearTimeout(progressTimer)
    progressTimer = setTimeout(() => {
        if (onProgress) onProgress('started')
    }, 250)

    const result = await new Promise(async (resolve, reject) => {
        try {
            await getExchangeLimited(sellAmount, buyAmount, myBalance,
                (data, res) => {
                    if (onProgress) onProgress('done')
                    clearTimeout(progressTimer)
                    if (onData) onData(data, res)
                    resolve(res)
                }, 
                selected, isSell)
        } catch (err) {
            reject(err)
        }
    })

    return result
}
