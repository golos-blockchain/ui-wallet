import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import { Link } from 'react-router';
import cn from 'classnames'
import tt from 'counterpart';
import { Asset } from 'golos-lib-js/lib/utils';

import ConvertAssetsBtn from 'app/components/elements/market/ConvertAssetsBtn'
import { blogsUrl } from 'app/utils/blogsUtils'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import {longToAsset} from 'app/utils/ParsersAndFormatters';
import g from 'app/redux/GlobalReducer'
import user from 'app/redux/User';
import DialogManager from 'app/components/elements/common/DialogManager';
import Icon from 'app/components/elements/Icon';
import Author from 'app/components/elements/Author';
import Button from 'app/components/elements/Button';
import LiteTooltip from 'app/components/elements/LiteTooltip'
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu';
import AssetRules from 'app/components/modules/uia/AssetRules';
import Reveal from 'react-foundation-components/lib/global/reveal';
import Tooltip from 'app/components/elements/Tooltip';
import { normalizeAssets, getTradablesFor } from 'app/utils/market/utils'
import { proxifyNFTImage } from 'app/utils/ProxifyUrl'
import { reloadLocation, hrefClick, } from 'app/utils/app/RoutingUtils'

class Assets extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
        isS: PropTypes.bool,
        hideRewardsMe: PropTypes.bool,
        hideUiaInfo: PropTypes.bool,
        smallUias: PropTypes.bool,
    }

    constructor() {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Assets')
    }

    state = {
        show_full_list: false,
        assetRules: null,
        showAssetRules: false,
    }

    loadMore = async () => {
      this.setState({
        show_full_list: !this.state.show_full_list
      });
    }

    muteAsset = async (e) => {
        const sym = e.currentTarget.dataset.sym;
        let mutedUIA = [];
        mutedUIA = localStorage.getItem('mutedUIA');
        if (mutedUIA) try { mutedUIA = JSON.parse(mutedUIA) } catch (ex) {}
        if (!mutedUIA) mutedUIA = [];
        mutedUIA.push(sym);
        if (!await DialogManager.dangerConfirm(tt('assets_jsx.mute_asset_confirm_TICKER', {TICKER: sym}))) {
            return;
        }
        localStorage.setItem('mutedUIA', JSON.stringify(mutedUIA));
        reloadLocation()
    }

    showAssetRules = (rules, sym) => {
        this.setState({
            showAssetRules: true,
            assetRules: {...rules, sym},
        });
    }

    hideAssetRules = () => {
        this.setState({
            showAssetRules: false,
        });
    }

    render() {
        const { account, isMyAccount, isS, hideRewardsMe, hideUiaInfo, smallUias } = this.props
        const account_name = account.get('name');

        const { assetRules, showAssetRules, } = this.state;

        const showTransfer = (to, asset, precision, transferType, e) => {
            e.preventDefault();
            this.props.showTransfer({
                to,
                asset, precision, transferType
            });
        };

        const showDeposit = (asset, creator, deposit) => {
            this.showAssetRules({...deposit, creator, isDeposit: true}, asset);
        };

        const showWithdrawal = (asset, precision, withdrawal) => {
            if (!withdrawal.ways || !withdrawal.ways.length) {
                this.showAssetRules(withdrawal, asset);
                return;
            }
            this.props.showTransfer({
                to: withdrawal.to,
                disableTo: true,
                asset, precision,
                transferType: 'Transfer to Account',
                withdrawal,
            });
        };

        const showOpenOrders = (e, sym) => {
            e.preventDefault();
            this.props.showOpenOrders({ sym, });
        };

        let mutedUIA = [];
        if (process.env.BROWSER && isMyAccount) {
            mutedUIA = localStorage.getItem('mutedUIA');
            if (mutedUIA) try { mutedUIA = JSON.parse(mutedUIA) } catch (ex) {}
            if (!mutedUIA) mutedUIA = [];
        }

        const assets = this.props.assets.toJS()

        const assetsNorm = normalizeAssets(assets)

        const presorted = []
        for (const [sym, item] of Object.entries(assets)) {
            item.parsed = Asset(item.balance)
            item.parsed_tip = Asset(item.tip_balance)
            item.parsed_sum = item.parsed.plus(item.parsed_tip).plus(Asset(item.market_balance))
            item.parsed_sum = parseFloat(item.parsed_sum.amountFloat)
            item.hideMe = !item.parsed_sum && !item.myCreated && $STM_Config.hidden_assets && $STM_Config.hidden_assets[sym]
            presorted.push([sym, item])
        }
        presorted.sort((a, b) => {
            if (!a[1].hideMe && b[1].hideMe) return -1
            if (a[1].hideMe && !b[1].hideMe) return 1
            if (a[1].parsed_sum > b[1].parsed_sum) return -1
            if (a[1].parsed_sum < b[1].parsed_sum) return 1
            return 0
        })

        let show_load_more = false;
        let my_assets = [];
        for (const [sym, item] of presorted) {
            if (item.hideMe) {
                show_load_more = true;
                if (!this.state.show_full_list) continue;
            }
            if (mutedUIA.includes(sym)) continue;

            let balance_menu = [
                { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, '', sym, item.precision, 'Transfer to Account' ) },
            ]

            if (!item.allow_override_transfer) {
                balance_menu.push({ value: tt('userwallet_jsx.transfer_to_tip'), link: '#', onClick: showTransfer.bind( this, account_name, sym, item.precision, 'Transfer to TIP' ) })
            }

            balance_menu.push({ value: tt('g.buy'), link: '/convert/YMUSDT/' + sym + '?buy' })

            let tip_menu = [
                { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, '', sym, item.precision, 'TIP to Account' ) },
                { value: tt('userwallet_jsx.transfer_to_liquid'), link: '#', onClick: showTransfer.bind( this, account_name, sym, item.precision, 'TIP to Vesting' ) },
            ]

            let description = ""
            let image_url = ""
            let telegram
            let deposit = null;
            let withdrawal = null;
            if (item.json_metadata.startsWith('{')) {
                let json_metadata = JSON.parse(item.json_metadata)
                description = json_metadata.description || ''
                image_url = proxifyNFTImage(json_metadata.image_url)
                telegram = json_metadata.telegram
                deposit = json_metadata.deposit;
                withdrawal = json_metadata.withdrawal;
            }

            if (telegram) {
                telegram = 'https://t.me/' + encodeURIComponent(telegram)
                telegram = <a onTouchStart={hrefClick} href={telegram} target='_blank' rel='nofollow noreferrer' style={{ marginLeft: '6px', fill: 'gray' }}>
                    <Icon name='new/telegram' title="Telegram" />
                </a>
            }

            const hasDeposit = deposit
                && (deposit.to_transfer
                    || deposit.to_fixed
                    || deposit.details);
            const hasWithdrawal = withdrawal
                && (withdrawal.to
                    || withdrawal.details);

            const depositDisabled = 
                (hasDeposit && deposit.unavailable) ?
                tt('asset_edit_withdrawal_jsx.unavailable') : 
                undefined;

            const withdrawalDisabled = 
                (hasWithdrawal && withdrawal.unavailable) ?
                tt('asset_edit_withdrawal_jsx.unavailable') : 
                undefined;

            const tradable_with_golos = !item.symbols_whitelist.length || item.symbols_whitelist.includes('GOLOS')

            const orders = item.market_balance ? parseFloat(item.market_balance) : 0.0;

            const ordersStr = item.market_balance;

            const tradables = getTradablesFor(assetsNorm, [sym], true)

            const convertDirection = item.parsed.amount ? 'sell' : 'buy'

            const assetInfo = <span className={cn("Assets__info", {
                small: hideUiaInfo
            })}>
                {tt('assets_jsx.creator')}: {hideUiaInfo ? <Link to={'/@' + item.creator} onTouchStart={hrefClick}>
                    {item.creator}
                </Link> : <Author author={item.creator} follow={false} />}{telegram}<br/>
                {tt('market_jsx.market_fee_percent_').trim() + ': ' + longToAsset(item.fee_percent, '', 2).trim() + '%'}<br/>
                {tt('assets_jsx.supply_count')}:<br/>
                {item.supply}
            </span>

            let assetIcons = [
                <a key='mute' data-sym={sym} onClick={this.muteAsset}><Icon name="eye_gray" size={smallUias ? '1x' : '0_95x'} title={tt('assets_jsx.mute_asset')} /></a>,
            ]
            if (hideUiaInfo) {
                assetIcons.unshift(
                    <LiteTooltip key='info' t={assetInfo}>
                        <Icon name="info_o" size={'1x'} />
                    </LiteTooltip>
                )
            }

            const makeBal = (bal) => {
                if (smallUias) {
                    bal = bal.split(' ')
                    bal = <span className='uia-balance'>{bal[0] + ' '}</span>
                }
                return bal
            }

            let tipBal = makeBal(item.tip_balance)
            let bal = makeBal(item.balance)
            tipBal = <React.Fragment>
                {(isMyAccount && !item.allow_override_transfer) ? <FoundationDropdownMenu
                    dropdownPosition="bottom"
                    dropdownAlignment="right"
                    label={tipBal}
                    menu={tip_menu}
                /> : tipBal}
                <br/><small>{tt('assets_jsx.tip_balance')}</small>
            </React.Fragment>

            const convertBtn = isMyAccount
                ? <ConvertAssetsBtn sym={sym} disabled={!tradables[0].length} direction={convertDirection} />
                : undefined

            const balIcon = tradable_with_golos ?
                <Link style={{fill: "#3e7bc6"}} to={"/market/"+sym+"/GOLOS"}>
                    <Icon name="trade" title={tt('assets_jsx.trade_asset')} />
                </Link> : null

            my_assets.push(<tr key={sym}>
                <td style={{ width: smallUias ? '100px' : undefined }}>
                {description ? (<a target="_blank" href={description} rel="noopener noreferrer">
                {image_url ? (<img className="Assets__marginBottom Assets__marginRight" width="36" height="36" src={image_url}/>) : null}{!smallUias && sym}</a>) : null}
                {!description ? (<span><img className="Assets__marginBottom Assets__marginRight" width="36" height="36" src={image_url}/>{!smallUias && sym}</span>) : null}
                {smallUias ? <div>{sym}</div> : <React.Fragment>&nbsp;&nbsp;</React.Fragment>}
                <div className={cn('Assets__icon_btns', { small: smallUias })}>{assetIcons}</div>
                    <div className="Assets__marginTop2">
                    {(isMyAccount && item.creator === account_name) && <Link to={`/@${account_name}/assets/${sym}/update`}
                        className={cn("button tiny ", {
                            'small-margin-bottom': true,
                            'hollow': hideUiaInfo
                        })}>
                        {tt('assets_jsx.update_btn')}
                    </Link>}
                    &nbsp;&nbsp;
                    {(isMyAccount && item.creator === account_name) ? <button
                        className={cn("button tiny", {
                            'small-margin-bottom': true,
                        })}
                        onClick={showTransfer.bind(this, account_name, sym, item.precision, 'Issue UIA')}
                    >
                        {tt('assets_jsx.issue_btn')}
                    </button> : null}</div>
                </td>
                <td>
                    {smallUias ? null : convertBtn}
                    {isMyAccount ? <FoundationDropdownMenu
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={bal}
                            menu={balance_menu}
                        /> : bal}
                    {smallUias && convertBtn}
                    {orders ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}>
                            <Link to={"/market/" + sym} onClick={e => showOpenOrders(e, sym)}>
                                <small><Tooltip t={tt('market_jsx.open_orders')}>+ {ordersStr}</Tooltip></small>
                            </Link>
                          </div> : <br/>}
                    {!smallUias && balIcon}{!smallUias && <small style={{ marginLeft: '5px' }}>{tt('assets_jsx.balance')}</small>}
                    {isMyAccount && hasDeposit && <button
                        onClick={() => showDeposit(sym, item.creator, deposit)}
                        disabled={depositDisabled}
                        title={depositDisabled}
                        className='button tiny Assets__inlineBtn'>{tt('assets_jsx.deposit')}</button>}
                    {isMyAccount && hasWithdrawal && <button
                        onClick={() => showWithdrawal(sym, item.precision, withdrawal)}
                        disabled={withdrawalDisabled}
                        title={withdrawalDisabled}
                        className='button tiny Assets__inlineBtn'>{tt('assets_jsx.withdrawal')}</button>}
                    {smallUias && <div style={{ marginTop: '0.5rem'}}>{tipBal}</div>}
                </td>
                {!smallUias && <td title={item.allow_override_transfer ? tt('assets_jsx.overridable_no_tip') : ''} className={item.allow_override_transfer ? 'Assets__disabled' : ''}>
                    {tipBal}
                </td>}
                {!hideUiaInfo && <td>
                    {assetInfo}
                </td>}
            </tr>);
        }
        return (<div>
            {hideUiaInfo ? null : <div className="row">
                <div className="column secondary">
                    {tt('assets_jsx.assets_info')} <a target='_blank' href={blogsUrl('/@allforyou/torguem-na-vnutrennei-birzhe-golosa')}>{tt('g.more_hint')}</a> <Icon name="extlink" size="1_5x" />
                <hr />
                </div>
            </div>}
            <div className="row">
                <div className="column small-12">
                    {!hideRewardsMe && <h4 className="Assets__header">{this.state.show_full_list ? tt('assets_jsx.all_assets') : tt('assets_jsx.my_assets')}</h4>}
                    <Link style={{marginLeft: "5px"}} to={`/convert/GOLOS/YMUSDT`} className="button float-right">
                        {tt('filled_orders_jsx.quick_convert')}
                    </Link>
                    {isMyAccount && <Link to={`/@${account_name}/create-asset`} className="button hollow float-right">
                        {tt('assets_jsx.create_btn')}
                    </Link>}                    
                </div>
            </div>
            <div className="row">
                <div className="column small-12">
                <table>
                <tbody>
                {my_assets}
                </tbody>
                </table>
                </div>
            </div>
            <div className="row">
                <div className="column small-12 Assets__center">
              {show_load_more && <Button onClick={this.loadMore} round="true" type="secondary">{this.state.show_full_list ? tt('assets_jsx.anti_load_more') : tt('assets_jsx.load_more')}</Button>}
                </div>
            </div>

            <Reveal show={showAssetRules}>
                <AssetRules
                    rules={assetRules}
                    sym={assetRules && assetRules.sym}
                    onClose={this.hideAssetRules}
                    />
            </Reveal>
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        return {...ownProps,
            assets: state.global.get('assets')
        }
    },
    dispatch => ({
        showOpenOrders: defaults => {
            dispatch(user.actions.setOpenOrdersDefaults(defaults));
            dispatch(user.actions.showOpenOrders());
        },
    })
)(Assets)
