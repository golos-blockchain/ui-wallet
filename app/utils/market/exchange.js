import { api, libs } from 'golos-lib-js'
import { Asset, _Asset, Price, _Price, fetchEx } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'
import isEqual from 'lodash/isEqual'

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

export async function getExchange(sellAmount, buyAmount, myBalance,
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

    let warning = ''
    let amDir, amMul
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
                warning = tt('convert_assets_jsx.no_orders_DIRECTION', {
                    DIRECTION: sellAmount.symbol + '/' + buyAmount.symbol
                })
            }
        } else {
            const bp = wrapPrice(resDir.best_price)
            if (isDir) {
                bestPrice = bp
                limitPrice = wrapPrice(resDir.limit_price)
            }
            amDir = wrapAsset(resDir.result)
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
        return { isSell, chain,
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
        return { isSell, direct: true,
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
            warning,

            bestPrice,
            limitPrice,

            chain: isDir ? null : chain,
            fee,
            reqFixed,

            altBanner,
            mainBanner,
            newSelected,
            bestType
        })
    }

    return res
}