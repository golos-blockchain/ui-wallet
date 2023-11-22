import fetchWithTimeout from 'shared/fetchWithTimeout'
import { Asset, Price } from 'golos-lib-js/lib/utils'

const request_base = {
    method: 'get',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
}

const pageBaseURL = 'https://coinmarketcap.com/currencies/'

const getPageURL = (slug) => {
    return new URL(slug + '/', pageBaseURL).toString()
}

const apidexAvailable = () => {
    return process.env.BROWSER && typeof($STM_Config) !== 'undefined'
        && $STM_Config.apidex_service && $STM_Config.apidex_service.host
}

export const apidexUrl = (pathname) => {
    try {
        return new URL(pathname, $STM_Config.apidex_service.host).toString();
    } catch (err) {
        console.error('apidexUrl', err)
        return ''
    }
}

let cached = {}

export async function apidexGetPrices(sym) {
    const empty = {
        price_usd: null,
        price_rub: null,
        page_url: null
    }
    if (!apidexAvailable()) return empty
    let request = Object.assign({}, request_base)
    try {
        const now = new Date()
        const cache = cached[sym]
        if (cache && (now - cache.time) < 60000) {
            return cache.resp
        } else {
            let resp = await fetchWithTimeout(apidexUrl(`/api/v1/cmc/${sym}`), 2000, request)
            resp = await resp.json()
            if (resp.data && resp.data.slug)
                resp['page_url'] = getPageURL(resp.data.slug)
            else
                resp['page_url'] = null
            cached[sym] = {
                resp, time: now
            }
            return resp
        }
    } catch (err) {
        console.error('apidexGetPrices', err)
        return empty
    }
}

let cachedAll = {}

export async function apidexGetAll() {
    const empty = {
        data: {}
    }
    if (!apidexAvailable()) return empty
    let request = Object.assign({}, request_base)
    try {
        const now = new Date()
        if (cachedAll && (now - cachedAll.time) < 60000) {
            return cachedAll.resp
        } else {
            let resp = await fetchWithTimeout(apidexUrl(`/api/v1/cmc`), 1000, request)
            resp = await resp.json()
            cachedAll = {
                resp, time: now
            }
            return resp
        }
    } catch (err) {
        console.error('apidexGetAll', err)
        return empty
    }
}

export async function apidexExchange(sell, buySym, direction = 'sell') {
    if (!apidexAvailable()) return null
    let request = Object.assign({}, request_base)
    try {
        let resp = await fetchWithTimeout(apidexUrl(`/api/v1/exchange/` + sell.toString() + '/' + buySym + '/' + direction), 2000, request)
        resp = await resp.json()
        if (resp.result) {
            resp.result = Asset(resp.result)
        }
        if (resp.best_price) {
            resp.best_price = Price(resp.best_price)
        }
        if (resp.limit_price) {
            resp.limit_price = Price(resp.limit_price)
        }
        if (resp.remain) {
            resp.remain = Asset(resp.remain)
        }
        return resp
    } catch (err) {
        console.error('apidexExchange', err)
        return null
    }
}