import { api } from 'golos-lib-js'
import { fetchEx } from 'golos-lib-js/lib/utils'

export default async function getUIAMaxAmount(symbol, way, okResp, errResp, rateLimitCheck = null) {
	try {
        if (!symbol)
            return errResp('no_symbol_parameter_in_query')

        if (!way)
            return errResp('no_way_parameter_in_query')

        if (rateLimitCheck && rateLimitCheck())
            return errResp('too_many_requests', [symbol])

        let assets
        try {
            assets = await api.getAssetsAsync('', [
                symbol,
            ], '', '20', 'by_symbol_name')
        } catch (err) {
            return errResp('blockchain_unavailable', [err])
        }
        if (!assets[0])
            return errResp('no_such_asset')

        let meta = assets[0].json_metadata
        try {
            meta = JSON.parse(meta)
        } catch (err) {
            return errResp('your_asset_has_wrong_json_metadata', [meta])
        }

        const ways = meta.withdrawal && meta.withdrawal.ways
        if (!Array.isArray(ways))
            return errResp('your_asset_has_no_withdraw_ways_array', [ways])

        let url
        for (const w of ways) {
            if (w.name === way) {
                url = w.max_amount_url
                break
            }
        }

        if (!url) {
            return errResp('your_asset_has_no_max_amount_url_in_this_way', [way])
        }

        try {
            url = new URL(url)
        } catch (err) {
            return errResp('your_asset_has_wrong_max_amount_url', [err, url], { url })
        }

        let resp
        try {
            resp = await fetchEx(url, { timeout: 10000 })
        } catch (err) {
            return errResp('cannot_fetch_max_amount', [meta.withdrawal, err])
        }
        try {
            resp = await resp.text()
        } catch (err) {
            return errResp('cannot_get_response_from_gateway', [meta.withdrawal, err])
        }
        try {
            resp = JSON.parse(resp)
        } catch (err) {
            resp = resp.substring(0, 100)
            return errResp('invalid_json_from_gateway', [meta.withdrawal, err], resp)
        }

        if (!resp || !resp.balance) {
            return errResp('json_response_has_no_balance_field', [meta.withdrawal, err], resp)
        }

        let { balance } = resp
        balance = parseFloat(balance)
        if (isNaN(balance)) {
            return errResp('balance is not a number', [resp.balance], resp.balance)
        }

        return okResp(balance)
    } catch (err) {
        return errResp('internal_error', [err])
    }
}
