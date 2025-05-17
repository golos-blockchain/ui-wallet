import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import g from 'app/redux/GlobalReducer';
import tt from 'counterpart';
import {List} from 'immutable';
import { libs, } from 'golos-lib-js'
import { Asset, } from 'golos-lib-js/lib/utils'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import Reveal from 'react-foundation-components/lib/global/reveal'

import ConvertAssetsBtn from 'app/components/elements/market/ConvertAssetsBtn'
import NotifiCounter from 'app/components/elements/NotifiCounter'
import SavingsWithdrawHistory from 'app/components/elements/SavingsWithdrawHistory';
import TransferHistoryRow from 'app/components/cards/TransferHistoryRow';
import TransactionError from 'app/components/elements/TransactionError';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import {numberWithCommas, toAsset, vestsToSteem, steemToVests, accuEmissionPerDay, vsEmissionPerDay} from 'app/utils/StateFunctions';
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu';
import LiteTooltip from 'app/components/elements/LiteTooltip'
import BalanceHeader from 'app/components/elements/BalanceHeader'
import { blogsUrl } from 'app/utils/blogsUtils'
import { markNotificationReadWs } from 'app/utils/NotifyApiClient'
import { hrefClick } from 'app/utils/app/RoutingUtils'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import Tooltip from 'app/components/elements/Tooltip';
import Icon from 'app/components/elements/Icon';
import Callout from 'app/components/elements/Callout';
import WalletBanner from 'app/components/modules/WalletBanner'
import { LIQUID_TICKER, VEST_TICKER, DEBT_TICKER} from 'app/client_config';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';

const assetPrecision = 1000;

class UserWallet extends React.Component {
    constructor() {
        super();
        this.state = {};
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'UserWallet');
    }

    loadPriceIfNeed = async () => {
        const { account } = this.props
        if (!account || this.state.price_rub) {
            return
        }
        const accumulative_balance_steem = parseFloat(account.get('accumulative_balance').split(' ')[0])
        const pr = await libs.dex.apidexGetPrices({ sym: 'GOLOS' })
        this.setState({
            price_rub: pr.price_rub,
            price_usd: pr.price_usd
        })
    }

    componentDidMount() {
        this.loadPriceIfNeed()
      //todo make transfer call a member? since code is repeated in some places
      const callTransfer = ({ to, amount, token, memo}) => {
      // immediate transfer processing (e.g. from foreign link)
      const transferType = 'Transfer to Account';
      this.props.showTransfer({
        to,
        asset: token.toUpperCase(), //since it's lowercased by koa
        transferType,
        memo,
        amount,
        disableMemo: true,
        disableTo: true,
        disableAmount: true
      });
    }
        const { transferDetails: { immediate, to, amount, token, memo } } = this.props;
        if (immediate) callTransfer({ to, amount, token, memo})

        const { account } = this.props
        if (account) {
            this.readNotifications(account)
        }
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.account && this.props.account) {
            this.loadPriceIfNeed()

            const { account } = this.props
            this.readNotifications(account)
        }
    }

    readNotifications = (account) => {
        setTimeout(() => {
            markNotificationReadWs(account.get('name'), ['delegate_vs'])
        }, 500)
    }

    render() {
        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN')
        const DEBT_TOKEN = tt('token_names.DEBT_TOKEN')
        const DEBT_TOKENS = tt('token_names.DEBT_TOKENS')
        const VESTING_TOKEN =  tt('token_names.VESTING_TOKEN')
        const VESTING_TOKEN2 = tt('token_names.VESTING_TOKEN2')

        const {showDeposit, depositType, toggleDivestError} = this.state
        const { showConvertDialog, price_per_golos, savings_withdraws, account, current_user, isS, } = this.props;

        if (!account || !this.props.gprops) return null;

        const gprops = this.props.gprops.toJS();
        const vesting_steem = vestsToSteem(account.get('vesting_shares'), gprops);
        const received_vesting_shares = vestsToSteem(account.get('received_vesting_shares'), gprops);
        const delegated_vesting_shares = vestsToSteem(account.get('delegated_vesting_shares'), gprops);
        const emission_received_vesting_shares = vestsToSteem(account.get('emission_received_vesting_shares'), gprops)
        const emission_delegated_vesting_shares = vestsToSteem(account.get('emission_delegated_vesting_shares'), gprops)
        const total_received_vesting_shares = (parseFloat(received_vesting_shares) + parseFloat(emission_received_vesting_shares)).toFixed(3)
        const total_delegated_vesting_shares = (parseFloat(delegated_vesting_shares) + parseFloat(emission_delegated_vesting_shares)).toFixed(3)

        let isMyAccount = current_user && current_user.get('username') === account.get('name');
        
        const lastActiveOperation = account.get('last_active_operation');
        const lastActiveOp = new Date(lastActiveOperation).getTime();
        const accountIdleness = lastActiveOp < new Date().setDate(new Date().getDate() - 180);

        // isMyAccount = false; // false to hide wallet transactions

        const showTransfer = (asset, transferType, e) => {
            e.preventDefault();
            this.props.showTransfer({
                to: (isMyAccount ? null : account.get('name')),
                asset, transferType
            });
        };

        const savings_balance = account.get('savings_balance');
        const savings_sbd_balance = account.get('savings_sbd_balance');

        const powerDown = (cancel, e) => {
            e.preventDefault()
            const name = account.get('name');
            if (cancel) {
                const vesting_shares = cancel
                    ? '0.000000 GESTS'
                    : account.get('vesting_shares');
                this.setState({toggleDivestError: null});
                const errorCallback = e2 => {
                    this.setState({ toggleDivestError: e2.toString() })
                };
                const successCallback = () => {
                    this.setState({ toggleDivestError: null })
                }
                this.props.withdrawVesting({
                    account: name,
                    vesting_shares,
                    errorCallback,
                    successCallback
                })
            } else {
                const to_withdraw = account.get('to_withdraw');
                const withdrawn = account.get('withdrawn');
                const vesting_shares = account.get('vesting_shares');
                let delegated_vesting_shares = Asset(account.get(
                    'delegated_vesting_shares'
                )).plus(Asset(account.get(
                    'emission_delegated_vesting_shares'
                ))).toString()
                this.props.showPowerdown({
                    account: name,
                    to_withdraw,
                    withdrawn,
                    vesting_shares,
                    delegated_vesting_shares,
                });
            }
        }

        const showDelegateVesting = (e) => {
            e.preventDefault()
            const name = account.get('name')
            this.props.delegateVesting(name)
        }

        const showDelegateVestingInfo = (type, e) => {
            e.preventDefault()
            const name = account.get('name')
            this.props.showDelegatedVesting(name, type)
        }

        const claim = (amount, e) => {
            e.preventDefault()
            const name = account.get('name')
            this.props.claim(name, amount)
        }

        // Sum savings withrawals
        let savings_pending = 0, savings_sbd_pending = 0;
        if(savings_withdraws) {
            savings_withdraws.forEach(withdraw => {
                const [amount, asset] = withdraw.get('amount').split(' ');
                if(asset === LIQUID_TICKER)
                    savings_pending += parseFloat(amount);
                else {
                    if(asset === DEBT_TICKER)
                        savings_sbd_pending += parseFloat(amount)
                }
            })
        }

        // Sum conversions
        let conversionValue = 0;
        const currentTime = (new Date()).getTime();
        const conversions = account.get('other_history', List()).reduce( (out, item) => {
            if(item.getIn([1, 'op', 0], "") !== 'convert') return out;

            const timestamp = new Date(item.getIn([1, 'timestamp'])).getTime();
            const finishTime = timestamp + (86400000 * 3.5); // add 3.5day conversion delay
            if(finishTime < currentTime) return out;

            const amount = parseFloat(item.getIn([1, 'op', 1, 'amount']).replace(' ' + DEBT_TICKER, ''));
            conversionValue += amount;

            return out.concat([
                <div key={item.get(0)}>
                    <LiteTooltip t={tt('userwallet_jsx.conversion_complete_tip') + ": " + new Date(finishTime).toLocaleString()}>
                        <span>(+{tt('userwallet_jsx.in_conversion', {amount: numberWithCommas(amount.toFixed(3)) + ' ' + DEBT_TICKER})})</span>
                    </LiteTooltip>
                </div>
            ]);
        }, [])

        const tip_balance_steem = parseFloat(account.get('tip_balance').split(' ')[0]);
        const accumulative_balance_steem = parseFloat(account.get('accumulative_balance').split(' ')[0])
        const balance_steem = parseFloat(account.get('balance').split(' ')[0]);
        const saving_balance_steem = parseFloat(savings_balance.split(' ')[0]);
        const divesting = parseFloat(account.get('vesting_withdraw_rate').split(' ')[0]) > 0.000000;
        const sbd_balance = parseFloat(account.get('sbd_balance'))
        const sbd_balance_savings = parseFloat(savings_sbd_balance.split(' ')[0]);

        const sbdOrders = parseFloat(account.get('market_sbd_balance'));
        const steemOrders = parseFloat(account.get('market_balance'));
        let nftHold = account.get('nft_hold_balance')
        nftHold = nftHold && Asset(nftHold)

        /// transfer log
        let idx = 0
        const transfer_log = account.get('transfer_history', [])
        .map(item => {
            const data = item.getIn([1, 'op', 1]);
            const type = item.getIn([1, 'op', 0]);
            
            // Filter out rewards
            if (type === "curation_reward" || type === "author_reward" || type === "donate") return null;
            
            if(data.sbd_payout === '0.000 GBG' && data.vesting_payout === '0.000000 GESTS') return null

            return <TransferHistoryRow key={idx++} op={item.toJS()} context={account.get('name')} />;
        }).filter(el => !!el).reverse();

        let tip_menu = [
            { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'TIP to Account' ) },
            { value: tt('userwallet_jsx.power_up'), link: '#', onClick: showTransfer.bind( this, VEST_TICKER, 'TIP to Vesting' ) },
        ]
        let claim_menu = [
            { value: tt('userwallet_jsx.claim'), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Claim' ) },
            { value: tt('userwallet_jsx.power_up'), link: '#', onClick: showTransfer.bind( this, VEST_TICKER, 'Claim' ) },
        ]
        let steem_menu = [
            { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Transfer to Account' ) },
            { value: tt('userwallet_jsx.transfer_to_tip'), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Transfer to TIP' ) },
            { value: tt('userwallet_jsx.power_up'), link: '#', onClick: showTransfer.bind( this, VEST_TICKER, 'Transfer to Account' ) },
            { value: tt('userwallet_jsx.transfer_to_savings'), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Transfer to Savings' ) },
            { value: tt('userwallet_jsx.convert_to_DEBT_TOKEN', {DEBT_TOKEN}), link: '#', onClick: showConvertDialog.bind(this, LIQUID_TICKER, DEBT_TICKER) },
        ]
        let power_menu = [
            { value: tt('userwallet_jsx.power_down'), link: '#', onClick: powerDown.bind(this, false) },
            { value: tt('delegatevestingshares_jsx.form_title', {VESTING_TOKEN2}), link:'#', onClick: showDelegateVesting.bind(this) }
        ]

        if( divesting ) {
            power_menu.pop()
            power_menu.push( { value: tt('userwallet_jsx.cancel_power_down'), link:'#', onClick: powerDown.bind(this,true) } );
        }

        let dollar_menu = [
            { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, DEBT_TICKER, 'Transfer to Account' ) },
            { value: tt('userwallet_jsx.transfer_to_savings'), link: '#', onClick: showTransfer.bind( this, DEBT_TICKER, 'Transfer to Savings' ) },
            { value: tt('userwallet_jsx.convert_to_LIQUID_TOKEN', {LIQUID_TOKEN}), link: '#', onClick: showConvertDialog.bind(this, DEBT_TICKER, LIQUID_TICKER) },
        ]
        const isWithdrawScheduled = new Date(account.get('next_vesting_withdrawal') + 'Z').getTime() > Date.now()

        let steem_balance_str = numberWithCommas(balance_steem.toFixed(3)) + ' ' + LIQUID_TICKER;
        let steem_tip_balance_str = numberWithCommas(tip_balance_steem.toFixed(3)) + ' ' + LIQUID_TICKER;
        const steem_claim_balance_str = numberWithCommas(accumulative_balance_steem.toFixed(3)) + ' ' + LIQUID_TICKER;
        let power_balance_str = numberWithCommas(vesting_steem) + ' ' + LIQUID_TICKER;
        let savings_balance_str = numberWithCommas(saving_balance_steem.toFixed(3)) + ' ' + LIQUID_TICKER;
        let sbd_balance_str = numberWithCommas(sbd_balance.toFixed(3)) + ' ' + DEBT_TICKER;
        let savings_sbd_balance_str = numberWithCommas(sbd_balance_savings.toFixed(3)) + ' ' + DEBT_TICKER;

        const received_vesting_shares_str = `${numberWithCommas(received_vesting_shares)} ${LIQUID_TICKER}`;
        const delegated_vesting_shares_str = `${numberWithCommas(delegated_vesting_shares)} ${LIQUID_TICKER}`;
        const emission_received_vesting_shares_str = `${numberWithCommas(emission_received_vesting_shares)} ${LIQUID_TICKER}`;
        const emission_delegated_vesting_shares_str = `${numberWithCommas(emission_delegated_vesting_shares)} ${LIQUID_TICKER}`;
        const total_received_vesting_shares_str = `${numberWithCommas(total_received_vesting_shares)} ${LIQUID_TICKER}`;
        const total_delegated_vesting_shares_str = `${numberWithCommas(total_delegated_vesting_shares)} ${LIQUID_TICKER}`;

        const steem_orders_balance_str = numberWithCommas(steemOrders.toFixed(3)) + ' ' + LIQUID_TICKER;
        const sbd_orders_balance_str = numberWithCommas(sbdOrders.toFixed(3)) + ' ' + DEBT_TICKER;

        const savings_menu = [
            { value: tt('userwallet_jsx.withdraw_LIQUID_TOKEN', {LIQUID_TOKEN}), link: '#', onClick: showTransfer.bind( this, LIQUID_TICKER, 'Savings Withdraw' ) },
        ]
        const savings_sbd_menu = [
            { value: tt('userwallet_jsx.withdraw_DEBT_TOKENS', {DEBT_TOKENS}), link: '#', onClick: showTransfer.bind( this, DEBT_TICKER, 'Savings Withdraw' ) },
        ]
        // set dynamic secondary wallet values
        let sbdInterest = this.props.sbd_interest / 100

        let EMISSION_STAKE = accuEmissionPerDay(account, gprops)
        // fix because payments are per hour
        if ((EMISSION_STAKE / 24) < 0.001) {
            EMISSION_STAKE = 0
        }

        const vesting_withdraw_rate_str = vestsToSteem(account.get('vesting_withdraw_rate'), gprops);

        const showOpenOrders = (e, sym) => {
            e.preventDefault();
            this.props.showOpenOrders({ sym, });
        };

        const showNftOrders = (e) => {
            e.preventDefault()
            this.props.showNftOrders()
        }

        const showPowerCalc = (e) => {
            e.preventDefault()
            this.props.showPowerCalc({ account: account.get('name') })
        }

        const { min_gp_to_curate } = this.props
        let claim_disabled = false
        let claim_hint
        let SUBTRACT = []
        if (vesting_steem >= min_gp_to_curate) {
            claim_hint = tt('tips_js.claim_balance_hint_enough_REQUIRED', {
                REQUIRED: (min_gp_to_curate + 0.001).toFixed(3) + ' ' + LIQUID_TICKER
            })
        } else {
            const subtract = min_gp_to_curate - vesting_steem + 0.001
            SUBTRACT.push(subtract.toFixed(3) + ' ' + LIQUID_TICKER)
            const { price_rub, price_usd } = this.state
            if (price_rub) {
                SUBTRACT.push(' (')
                let price_title
                if (price_usd) {
                    price_title = '~' + (subtract * price_usd).toFixed(2) + ' USD'
                }
                SUBTRACT.push(<span key='price' title={price_title}>
                        {'~' + (subtract * price_rub).toFixed(2) + ' RUB'}
                    </span>)
                SUBTRACT.push(')')
            }
            let DAILY = vsEmissionPerDay(gprops, 0, parseFloat(steemToVests(subtract, gprops)))
            DAILY = numberWithCommas(DAILY.toFixed(3)) + ' ' + LIQUID_TICKER
            claim_hint = <span>
                {tt('tips_js.claim_balance_hint1')}
                {SUBTRACT}
                {tt('tips_js.claim_balance_hint2')}
                {accumulative_balance_steem ? tt('tips_js.claim_balance_hint_claim') : tt('tips_js.claim_balance_hint_no_claim')}
                {tt('tips_js.claim_balance_hint_DAILY', {
                    DAILY
                })}
                &nbsp;<Link to="/convert/YMUSDT/GOLOS?buy">{tt('tips_js.buy_tokens')}</Link>
            </span>
            claim_disabled = true
        }

        const wrapTooltip = (child, t, props = {}) => {
            if (process.env.MOBILE_APP) {
                return child
            }
            return <LiteTooltip t={t} {...props}>
                {child}
            </LiteTooltip>
        }

        const emissionStake = wrapTooltip(<a href="#" onClick={showPowerCalc}><small>
                {tt('tips_js.vesting_emission_per_day', {EMISSION_STAKE: numberWithCommas(EMISSION_STAKE.toFixed(3)) + ' ' + LIQUID_TICKER})}
            </small></a>,
            tt('tips_js.vesting_emission_per_day_title'))

        // general APR, for 10.000 GOLOS Golos Power
        let aprTIP = vsEmissionPerDay(gprops, parseFloat(steemToVests(10000, gprops))) * 365 / 10000 * 100
        aprTIP = <LiteTooltip t={tt('userwallet_jsx.apr_gp')}><span className={'emission_apr' + (EMISSION_STAKE ? '' : ' gray')} onClick={showPowerCalc}>
            {'APR ' + aprTIP.toFixed(2) + ' %'}
            </span></LiteTooltip>

        let gbgPerMonth = sbd_balance_savings / 12
        let gbgTip = ''
        let gbgAprTip = tt('userwallet_jsx.apr_gbg')
        if (vesting_steem < min_gp_to_curate) {
            gbgPerMonth = 0
            gbgTip = [tt('tips_js.savings_interest_gp'), ...SUBTRACT, tt('tips_js.savings_interest_gp2')]
        } else if (gprops.is_forced_min_price) {
            gbgPerMonth = 0
            sbdInterest = 0
            gbgTip = tt('tips_js.savings_interest_debt')
            gbgAprTip = gbgTip
        } else if (sbdInterest === 0) {
            gbgPerMonth = 0
            sbdInterest = 0
            gbgTip = tt('tips_js.savings_interest_zero')
            gbgAprTip = gbgTip
        } else {
            gbgPerMonth = (gbgPerMonth * sbdInterest / 100).toFixed(3)
            gbgTip = tt('tips_js.savings_interest')
        }

        steem_balance_str = <span className='main-balance'>{steem_balance_str}</span>
        steem_tip_balance_str = <span className='main-balance'>{steem_tip_balance_str}</span>
        power_balance_str = <span className='main-balance'>{power_balance_str}</span>
        savings_balance_str = <span className='main-balance'>{savings_balance_str}</span>
        sbd_balance_str = <span className='main-balance'>{sbd_balance_str}</span>
        savings_sbd_balance_str = <span className='main-balance'>{savings_sbd_balance_str}</span>

        const { ClaimBalance, TipBalance, VestingBalance, GolosBalance, GbgBalance, SavingsBalance } = BalanceHeader

        let claimBtn = null
        if (isMyAccount && accumulative_balance_steem) {
            claimBtn = <button
                className="Wallet__claim_button button tiny"
                disabled={claim_disabled}
                onClick={claim.bind(this, account.get('accumulative_balance'))}
            >
                {tt('g.claim')}
            </button>
            if (claim_disabled) {
                claimBtn = <LiteTooltip t={[tt('tips_js.claim_min_gp'), ...SUBTRACT, tt('tips_js.claim_min_gp2')]}>
                    {claimBtn}
                </LiteTooltip>
            }
        }

        return (<div className={"UserWallet top-margin" + (isS ? ' small-screen' : '')}>
            {accountIdleness && <Callout>
                <div align="center">{tt('userwallet_jsx.account_idleness')}. <a target="_blank" href="https://wiki.golos.id/users/update#ponizhenie-sily-golosa-pri-neaktivnosti">{tt('g.more_hint')} <Icon name="extlink" /></a>
                <br /><Icon name="golos" size="2x" /><br />
                Рекомендуем прочитать и об <a target="_blank" href="https://wiki.golos.id/users/update">изменениях</a> на Голосе за последнее время...</div>
            </Callout>}

            <TransactionError opType="withdraw_vesting" />

            {(vesting_steem < min_gp_to_curate || accumulative_balance_steem) ? <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">
                    <ClaimBalance tipText={claim_hint} isS={isS} />
                </div>
                <div className="column small-12 medium-4">
                    <span className='main-balance'>{steem_claim_balance_str}</span>
                    <div>{claimBtn}</div>
                    {vesting_steem < min_gp_to_curate && emissionStake}
                </div>
            </div> : null}
            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    <TipBalance isS={isS} />
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={steem_tip_balance_str}
                            menu={tip_menu}
                        />
                        : steem_tip_balance_str
                    }
                    <br/>
                    {vesting_steem >= min_gp_to_curate ? emissionStake : null}
                </div>
            </div>
            <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">                    
                    <VestingBalance isS={isS} />
                </div>
                <div className="column small-12 medium-4">
                    {aprTIP}
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={power_balance_str}
                            menu={power_menu}
                          />
                        : power_balance_str
                    }
                    <br />
                    {total_received_vesting_shares != 0 ? (
                            <div style={{ paddingRight: isMyAccount ? '0.85rem' : null }} >
                                {wrapTooltip(
                                    <small><a className='received_vesting' href="#" onClick={showDelegateVestingInfo.bind(this, 'received')}>
                                        + {total_received_vesting_shares_str}
                                        <NotifiCounter fields='delegate_vs' />
                                    </a></small>,
                                tt('g.received_vesting', {VESTING_TOKEN}))}
                            </div>
                        ) : null}
                    {total_delegated_vesting_shares != 0 ? (
                            <div style={{ paddingRight: isMyAccount ? '0.85rem' : null }} >
                                {wrapTooltip(
                                    <small><a href="#" onClick={showDelegateVestingInfo.bind(this, 'delegated')}>
                                        - {total_delegated_vesting_shares_str}
                                    </a></small>,
                                tt('g.delegated_vesting', {VESTING_TOKEN}))}
                            </div>
                        ) : null}
                    {isWithdrawScheduled && <div><small><Icon name="hf/hf11" /> {tt('userwallet_jsx.next_power_down_to_happen')}&nbsp;{vesting_withdraw_rate_str} {LIQUID_TICKER}&nbsp;<TimeAgoWrapper date={account.get('next_vesting_withdrawal')} /></small></div>}
                </div>
            </div>
            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    <GolosBalance isS={isS} />
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <ConvertAssetsBtn sym='GOLOS' direction={balance_steem > 0 ? 'sell' : 'buy'} />
                        : undefined
                    }
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={steem_balance_str}
                            menu={steem_menu}
                        />
                        : steem_balance_str
                    }
                    {steemOrders
                        ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}>
                            <Link to={'/market/GOLOS'} onClick={e => showOpenOrders(e, 'GOLOS')}>
                                <small>{wrapTooltip(<React.Fragment>+ {steem_orders_balance_str}</React.Fragment>,
                                    tt('market_jsx.open_orders'))}
                                </small>
                            </Link>
                         </div>
                        : null
                    }
                    {(isMyAccount && nftHold && nftHold.gt(0))
                        ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}>
                            <Link to={'/@' + account.get('name') + '/nft-orders'} onClick={e => showNftOrders(e)}>
                                <small>{wrapTooltip(<React.Fragment>+ {nftHold.toString()}</React.Fragment>,
                                    tt('g.nft_orders'))}
                                </small>
                            </Link>
                         </div>
                        : null
                    }
                    <div>{isMyAccount ? <a
                        href='/convert/YMUSDT/GOLOS?buy'
                        onClick={hrefClick}
                        target='_blank'
                        rel='nofollow noreferrer'
                        className="button tiny hollow"
                        style={{ marginBottom: '0px' }}
                    >{tt('g.buy')}</a> : null}</div>
                </div>
            </div>
            <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">
                    <GbgBalance isS={isS} />
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <ConvertAssetsBtn sym='GBG' direction={sbd_balance > 0 ? 'sell' : 'buy'} />
                        : undefined
                    }
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={sbd_balance_str}
                            menu={dollar_menu}
                          />
                        : sbd_balance_str
                    }
                    {sbdOrders 
                        ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}>
                            <Link to={'/market/GBG'} onClick={e => showOpenOrders(e, 'GBG')}>
                                <small>{wrapTooltip(<React.Fragment>+ {sbd_orders_balance_str}</React.Fragment>,
                                    tt('market_jsx.open_orders'))}</small>
                            </Link>
                          </div>
                        : null
                    }
                    {conversions}
                </div>
            </div>
            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    <SavingsBalance isS={isS} />
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={savings_balance_str}
                            menu={savings_menu}
                          />
                        : savings_balance_str
                    }
                    <br />
                    <LiteTooltip t={gbgAprTip}>
                        <span className={'emission_apr gbg' + (gbgPerMonth ? '' : ' gray')}>
                            {'APR ' + sbdInterest.toFixed(2) + ' %'}
                        </span>
                    </LiteTooltip>
                    {isMyAccount
                        ? <FoundationDropdownMenu
                            className="Wallet_dropdown"
                            dropdownPosition="bottom"
                            dropdownAlignment="right"
                            label={savings_sbd_balance_str}
                            menu={savings_sbd_menu}
                          />
                        : <span className='main-balance'>{savings_sbd_balance_str}</span>
                    }
                    <div><LiteTooltip t={gbgTip}>
                        <small>
                            {tt('tips_js.savings_interest_PER_MONTH', { PER_MONTH: gbgPerMonth + ' GBG' })}
                        </small>
                    </LiteTooltip></div>
                </div>
            </div>
            <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">
                    {tt('userwallet_jsx.assets_issued')} &nbsp;<Link to={"/@" + account.get('name') + "/assets"}><img src={require("app/assets/images/ymusdt.jpg")} width="24" height="24" /> <img src={require("app/assets/images/ymhive.jpg")} width="24" height="24" /> <img src={require("app/assets/images/ymprizm.jpg")} width="24" height="24" /> <img src={require("app/assets/images/ymrub.jpg")} width="24" height="24" /> <img src={require("app/assets/images/ymsteem.jpg")} width="24" height="24" /></Link>&nbsp; {tt('userwallet_jsx.others')}...<br />
                    <span className="secondary">{tt('userwallet_jsx.trade_gateways')}.</span>
                </div>
                <div className="column small-12 medium-4">
                    <Link to={"/@" + account.get('name') + "/assets"}><small>{tt('userwallet_jsx.go_to_assets')}</small></Link>
                </div>
            </div>

            <div align="center"><br />
                <WalletBanner hot_auctions={this.props.hot_auctions} account={account} />
            </div>

            <div className="row">
                <div className="column small-12">
                    <hr />
                </div>
            </div>

            {isMyAccount && <SavingsWithdrawHistory />}

            <div className="row">
                <div className="column small-12">
                    {/** history */}
                    <span className="secondary" style={{ float: 'right' }}><Icon name="new/search" /> {tt('userwallet_jsx.history_viewing')}: <a target="_blank" href={"https://explorer.golos.id/#account/" + account.get('name')}>explorer <Icon name="extlink" /></a> / <a target="_blank" rel="noopener noreferrer" href={"https://gapi.golos.today/api/account_history/get_account_history?account=" + account.get('name')}>gapi <Icon name="extlink" /></a></span>
                    <h4>{tt('userwallet_jsx.history')}</h4>
                    <table>
                        <tbody>
                        {transfer_log}
                        </tbody>
                     </table>
                </div>
            </div>
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        let price_per_golos = undefined
        const feed_price = state.global.get('feed_price')
        if(feed_price && feed_price.has('base') && feed_price.has('quote')) {
            const {base, quote} = feed_price.toJS()
            if(/ GBG$/.test(base) && / GOLOS$/.test(quote))
                price_per_golos = parseFloat(base.split(' ')[0]) / parseFloat(quote.split(' ')[0])
        }
        const savings_withdraws = state.user.get('savings_withdraws')
        const gprops = state.global.get('props');
        const sbd_interest = gprops ? gprops.get('sbd_interest_rate') : 0
        const cprops = state.global.get('cprops')
        const hot_auctions = state.global.get('hot_auctions')

        let min_gp_to_curate = 0
        if (price_per_golos && cprops) {
            let min_gbg = cprops.get('min_golos_power_to_emission')
            if (min_gbg) {
                min_gbg = parseFloat(min_gbg)
                min_gp_to_curate = min_gbg / price_per_golos + 0.001
            }
        }

        return {
            ...ownProps,
            price_per_golos,
            savings_withdraws,
            sbd_interest,
            gprops,
            cprops,
            min_gp_to_curate,
            hot_auctions
        }
    },
    // mapDispatchToProps
    dispatch => ({
        showConvertDialog: (from, to, e) => {
            e.preventDefault()
            const name = 'convertToSteem'
            dispatch(g.actions.showDialog({name, params: {from, to}}))
        },
        showChangePassword: (username) => {
            const name = 'changePassword'
            dispatch(g.actions.remove({key: name}))
            dispatch(g.actions.showDialog({name, params: {username}}))
        },
        delegateVesting: (username) => {
            dispatch(g.actions.showDialog({name: 'delegate_vesting', params: {username}}))
        },
        showDelegatedVesting: (account, type) => {
            dispatch(g.actions.showDialog({name: 'delegate_vesting_info', params: {account, type}}))
        },
        showOpenOrders: defaults => {
            dispatch(user.actions.setOpenOrdersDefaults(defaults));
            dispatch(user.actions.showOpenOrders());
        },
        showNftOrders: () => {
            dispatch(user.actions.showNftOrders());
        },
        showPowerCalc: ({ account }) => {
            dispatch(user.actions.setPowerCalcDefaults({ account }))
            dispatch(user.actions.showPowerCalc())
        },
        claim: (username, amount) => {
            const successCallback = () => {
                // refresh transfer history
                dispatch({type: 'FETCH_STATE', payload: {pathname: `@${username}/transfers`}})
            }
            const errorCallback = (estr) => {
                alert(estr);
            }

            let operation = {from: username, to: username, amount, memo: '', to_vesting: false};

            dispatch(transaction.actions.broadcastOperation({
                type: 'claim',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(UserWallet)