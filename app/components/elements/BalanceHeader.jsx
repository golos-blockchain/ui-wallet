import React from 'react'
import tt from 'counterpart'
import {Link} from 'react-router'

import Icon from 'app/components/elements/Icon'
import LiteTooltip from 'app/components/elements/LiteTooltip'
import { LIQUID_TICKER, } from 'app/client_config';
import { hrefClick } from 'app/utils/app/RoutingUtils'

const VESTING_TOKEN2 = tt('token_names.VESTING_TOKEN2')
const VESTING_TOKENS = tt('token_names.VESTING_TOKENS')

class BalanceHeader extends React.Component {
    render() {
        let { head, headLink, tipText, tipAfter, isS } = this.props

        const tipFrag = <React.Fragment>
            <span className={isS ? '' : 'secondary'}>
                {!tipText.split ? tipText : tipText.split(".").map((a, index) => {if (a) {return <div key={index}>{a}.</div>;} return null;})}
                {tipAfter}
            </span>
        </React.Fragment>

        let headFrag
        if (head) {
            head = head.toUpperCase()
            if (isS) {
                //const icon = <Icon name='info_o' />
                const icon = <span className="secondary">(?)</span>
                headFrag = <LiteTooltip t={tipFrag}>
                    {head} {icon}<br />
                </LiteTooltip>
            } else {
                headFrag = <React.Fragment>
                    {head} <span className="secondary">{headLink ? <small><a target="_blank" href={headLink}>(?)</a></small> : null}</span><br />
                </React.Fragment>
            }
        }

        return <React.Fragment>
            {headFrag}
            {isS ? null : tipFrag}
        </React.Fragment>
    }
}

function ClaimBalance(props) {
    const CLAIM_TOKEN = tt('token_names.CLAIM_TOKEN')

    return <BalanceHeader head={CLAIM_TOKEN} headLink={'https://wiki.golos.id/users/welcome/wallet#nakopitelnyi-balans'}
        tipText={props.tipText}
        isS={props.isS}
    />
}

function TipBalance(props) {
    const TIP_TOKEN = tt('token_names.TIP_TOKEN')
    const steemTip =tt('tips_js.tip_balance_hint')

    return <BalanceHeader head={TIP_TOKEN} headLink={'https://wiki.golos.id/users/welcome/wallet#tip-balans'}
        tipText={steemTip}
        isS={props.isS}
    />
}

function VestingBalance(props) {
    const VESTING_TOKEN =  tt('token_names.VESTING_TOKEN')

    return <BalanceHeader head={VESTING_TOKEN} headLink={'https://wiki.golos.id/users/welcome/wallet#sila-golosa'}
        tipText={tt('tips_js.influence_tokens_which_give_you_more_control_over', {VESTING_TOKEN, VESTING_TOKENS})}
        tipAfter={<React.Fragment>
            <Link onTouchStart={hrefClick} to="/workers">{tt('userwallet_jsx.worker_foundation')}</Link> | {tt('userwallet_jsx.top_dpos')} <a onTouchStart={hrefClick} target="_blank" rel="noopener noreferrer" href="https://dpos.space/golos/top/gp">dpos.space <Icon name="extlink" /></a> {tt('g.and')} <a onTouchStart={hrefClick} target="_blank" rel="noopener noreferrer" href="https://pisolog.net/stats/accounts/allaccounts">pisolog.net <Icon name="extlink" /></a>
        </React.Fragment>}
        isS={props.isS}
    />
}

function GolosBalance(props) {
    const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN')
    const steemTip = tt('tips_js.tradeable_tokens_that_may_be_transferred_anywhere_at_anytime') + ' ' + tt('tips_js.LIQUID_TOKEN_can_be_converted_to_VESTING_TOKEN_in_a_process_called_powering_up', {LIQUID_TOKEN, VESTING_TOKEN2, VESTING_TOKENS});

    return <BalanceHeader head={LIQUID_TOKEN} headLink={'https://wiki.golos.id/users/welcome/wallet#golos'}
        tipText={steemTip}
        isS={props.isS}
    />
}

function GbgBalance(props) {
    const DEBT_TOKEN = tt('token_names.DEBT_TOKEN')
    const TOKEN_WORTH = tt('token_names.TOKEN_WORTH')
    const gbgTip = tt('userwallet_jsx.tokens_worth_about_1_of_LIQUID_TICKER', {TOKEN_WORTH, LIQUID_TICKER,})

    return <BalanceHeader head={DEBT_TOKEN} headLink={'https://wiki.golos.id/users/welcome/wallet#zolotoi'}
        tipText={gbgTip}
        isS={props.isS}
    />
}

function SavingsBalance(props) {
    const DEBT_TOKEN = tt('token_names.DEBT_TOKEN')
    const TOKEN_WORTH = tt('token_names.TOKEN_WORTH')
    const savingsTip = tt('transfer_jsx.balance_subject_to_3_day_withdraw_waiting_period')

    return <BalanceHeader head={tt('userwallet_jsx.savings')}
        tipText={savingsTip}
        isS={props.isS}
    />
}

export default {
    TipBalance,
    GolosBalance,
    GbgBalance,
    SavingsBalance,
    VestingBalance,
    ClaimBalance,
    BalanceHeader,
}
