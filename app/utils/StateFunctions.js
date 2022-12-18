import assert from 'assert';
import constants from 'app/redux/constants';
import {parsePayoutAmount, repLog10} from 'app/utils/ParsersAndFormatters';
import {Long} from 'bytebuffer';
import {VEST_TICKER, LIQUID_TICKER} from 'app/client_config'
import {Map, Seq, fromJS} from 'immutable';

// '1000000' -> '1,000,000'
export const numberWithCommas = (x) => x.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

export const toAsset = (value) => {
    const [ amount, symbol ] = value.split(' ')
    return { amount: parseFloat(amount), symbol }
}

export function vestsToSp(state, vesting_shares) {
    const {global} = state
    const vests = assetFloat(vesting_shares, VEST_TICKER)
    const total_vests = assetFloat(global.getIn(['props', 'total_vesting_shares']), VEST_TICKER)
    const total_vest_steem = assetFloat(global.getIn(['props', 'total_vesting_fund_steem']), LIQUID_TICKER)
    const vesting_steemf = total_vest_steem * (vests / total_vests);
    const steem_power = vesting_steemf.toFixed(3)
    return steem_power
}

export function vestsToSteem (vestingShares, gprops) {
    const { total_vesting_fund_steem, total_vesting_shares } = gprops
    const totalVestingFundSteem = toAsset(total_vesting_fund_steem).amount
    const totalVestingShares = toAsset(total_vesting_shares).amount
    const vesting_shares = toAsset(vestingShares).amount
    return (totalVestingFundSteem * (vesting_shares / totalVestingShares)).toFixed(3)
}

export function steemToVests(steem, gprops) {
    const { total_vesting_fund_steem, total_vesting_shares } = gprops
    const totalVestingFundSteem =  toAsset(total_vesting_fund_steem).amount
    const totalVestingShares =  toAsset(total_vesting_shares).amount
    const vests = steem / (totalVestingFundSteem / totalVestingShares)
    return vests.toFixed(6)
}

export function assetFloat(str, asset) {
    try {
        assert.equal(typeof str, 'string')
        assert.equal(typeof asset, 'string')
        assert(new RegExp(`^\\d+(\\.\\d+)? ${asset}$`).test(str), 'Asset should be formatted like 99.99 ' + asset + ': ' + str)
        return parseFloat(str.split(' ')[0])
    } catch(e) {
        console.log(e);
        return undefined
    }
}

export function isFetchingOrRecentlyUpdated(global_status, order, category) {
    const status = global_status ? global_status.getIn([category || '', order]) : null;
    if (!status) return false;
    if (status.fetching) return true;
    if (status.lastFetch) {
        return Date.now() - status.lastFetch < constants.FETCH_DATA_EXPIRE_SEC * 1000;
    }
    return false;
}

export function filterTags(tags) {
    return tags.filter(tag => typeof tag === 'string')
}

export function fromJSGreedy(js) {
  return typeof js !== 'object' || js === null ? js :
    Array.isArray(js) ?
      Seq(js).map(fromJSGreedy).toList() :
      Seq(js).map(fromJSGreedy).toMap();
}

export function accuEmissionPerDay(accountObj, gpropsObj, addFloat = 0) {
    const acc = accountObj.toJS ? accountObj.toJS() : accountObj
    const gprops = gpropsObj.toJS ? gpropsObj.toJS() : gpropsObj
    let vs = toAsset(acc.vesting_shares).amount
        - toAsset(acc.emission_delegated_vesting_shares).amount
        + toAsset(acc.emission_received_vesting_shares).amount
        + addFloat
    const total = toAsset(gprops.total_vesting_shares).amount + addFloat
    let emission = toAsset(gprops.accumulative_emission_per_day).amount * vs / total
    return emission
}
