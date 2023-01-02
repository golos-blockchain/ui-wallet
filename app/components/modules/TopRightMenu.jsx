import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import tt from 'counterpart';
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown';

import Icon from 'app/components/elements/Icon';
import user from 'app/redux/User';
import Userpic from 'app/components/elements/Userpic';
import VerticalMenu from 'app/components/elements/VerticalMenu';
import LocaleSelect from 'app/components/elements/LocaleSelect';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import NotifiCounter from 'app/components/elements/NotifiCounter';
import { LIQUID_TICKER, DEBT_TICKER } from 'app/client_config';
import { vestsToSteem, toAsset } from 'app/utils/StateFunctions';
import { authRegisterUrl, } from 'app/utils/AuthApiClient';
import { blogsUrl, } from 'app/utils/blogsUtils'
import { msgsHost, msgsLink, } from 'app/utils/ExtLinkUtils';

const defaultNavigate = (e) => {
    if (e.metaKey || e.ctrlKey) {
        // prevent breaking anchor tags
    } else {
        e.preventDefault();
    }
    const a = e.target.nodeName.toLowerCase() === 'a' ? e.target : e.target.parentNode;
    browserHistory.push(a.pathname + a.search + a.hash);
};

const calculateEstimateOutput = ({ account, price_per_golos, savings_withdraws, globalprops }) => {
  if (!account) return 0;

  // Sum savings withrawals
  if (savings_withdraws) {
    savings_withdraws.forEach(withdraw => {
      const [amount, asset] = withdraw.get('amount').split(' ');
    })
  }

  const total_sbd = 0 
    + parseFloat(toAsset(account.get('sbd_balance')).amount)
    + parseFloat(toAsset(account.get('market_sbd_balance')).amount)
    + parseFloat(toAsset(account.get('savings_sbd_balance')).amount)

  const total_steem = 0
    + parseFloat(toAsset(account.get('balance')).amount)
    + parseFloat(toAsset(account.get('savings_balance')).amount)
    + parseFloat(toAsset(account.get('tip_balance')).amount)
    + parseFloat(toAsset(account.get('market_balance')).amount)
    + parseFloat(vestsToSteem(account.get('vesting_shares'), globalprops.toJS()))

  return Number(((total_steem * price_per_golos) + total_sbd).toFixed(2) );
}

function TopRightMenu({account, savings_withdraws, price_per_golos, globalprops, username, showLogin, goChangeAccount, loggedIn, vertical, navigate, probablyLoggedIn, location, locationQueryParams, toggleNightmode}) {
    const APP_NAME = tt('g.APP_NAME');
    const mcn = 'menu' + (vertical ? ' vertical show-for-small-only' : '');
    const mcl = vertical ? '' : ' sub-menu';
    const lcn = vertical ? '' : 'show-for-large';
    const scn = vertical ? '' : 'show-for-medium';
    const nav = navigate || defaultNavigate;
    const topbutton = <li className={lcn + ' submit-story'}>
        <a href={blogsUrl('/services')} className='button small topbutton hollow'>
            <Icon name="new/monitor" size="0_95x" />{tt('g.topbutton')}
        </a>
    </li>;
    const goBlogs = <li className={scn + ' submit-story'}>
        <a href={blogsUrl()} className={'button small topbutton'}>
            <Icon name="new/add" size="0_95x" />{tt('g.go_blogs')}
        </a>
    </li>;
    const goBlogsPencil = <li className="hide-for-medium submit-story-pencil">
        <a href={blogsUrl()} className="button small">
            <Icon name="new/add" size="0_95x" />
        </a>
    </li>;
    const walletLink = `/@${username}/transfers`;
    const uiaLink = `/@${username}/assets`;
    const inviteLink = `/@${username}/invites`;
    const ordersLink = `/@${username}/filled-orders`;
    const blogLink = blogsUrl(`/@${username}`);
    const donatesLink = `/@${username}/donates-to`;
    const messagesLink = msgsHost() ? msgsLink() : '';
    const settingsLink = `/@${username}/settings`;

    const witnessItem = <li className={scn}>
        <Link to="/~witnesses" title={tt('navigation.witnesses')}><Icon name="new/like" size="1_25x" /></Link>
      </li>
    ;

    const marketItem = <li className={scn}>
        <Link to="/market/GOLOS/YMUSDT" title={tt('navigation.market')}><Icon name="trade" size="1_5x" /></Link>
      </li>
    ;

    let invite = username;
    if (process.env.BROWSER) {
        if (invite) {
            localStorage.setItem('invite', invite);
        } else {
            invite = localStorage.getItem('invite');
        }
    }

    const registerUrl = authRegisterUrl() + (invite ? ('?invite=' + invite) : '');

    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/'

    const additional_menu = []
    if (!loggedIn) {
        if (!isLoginPage) {
            additional_menu.push(
                { link: '/login.html', onClick: showLogin, value: tt('g.login'), className: 'show-for-small-only' },
            )
        }
        additional_menu.push(
            { link: registerUrl,
                onClick: (e) => {
                    e.preventDefault();
                    window.location.href = registerUrl;
                },
                value: tt('g.sign_up'), className: 'show-for-small-only' }
        )
    }
    additional_menu.push(
        { link: '#', onClick: toggleNightmode, icon: 'editor/eye', value: tt('g.night_mode') },
        { link: '/market', icon: 'trade', value: tt("navigation.market") },
        { link: blogsUrl('/services'), icon: 'new/monitor', value: tt("navigation.services") },
        { link: blogsUrl('/search'), icon: 'new/search', value: tt("navigation.search") },
        { link: '/exchanges', icon: 'editor/coin', value: tt("navigation.buy_sell") },
        { link: '/~witnesses', icon: 'new/like', value: tt("navigation.witnesses") },
        { link: '/workers', icon: 'voters', value: tt("navigation.workers") },
        { link: 'https://wiki.golos.id/', icon: 'new/wikipedia', value: tt("navigation.wiki"), target: 'blank' },
        { link: 'https://explorer.golos.id/', icon: 'cog', value: tt("navigation.explorer"), target: 'blank' } 
    );
    const navAdditional = <LinkWithDropdown
        closeOnClickOutside
        dropdownPosition="bottom"
        dropdownAlignment="right"
        dropdownContent={<VerticalMenu className={'VerticalMenu_nav-additional'} items={additional_menu} />}
    >
        {!vertical && <li>
            <a href="#" onClick={e => e.preventDefault()}>
                <Icon name="new/more" />
            </a>
        </li>}
    </LinkWithDropdown>;

    if (loggedIn) { // change back to if(username) after bug fix:  Clicking on Login does not cause drop-down to close #TEMP!
        let user_menu = [
            {link: walletLink, icon: 'new/wallet', value: tt('g.wallet'), addon: <NotifiCounter fields="send,receive" />},
            {link: uiaLink, icon: 'editor/coin', value: tt('g.assets')},
            {link: ordersLink, icon: 'trade', value: tt('navigation.market2'), addon: <NotifiCounter fields="fill_order" />},
            {link: inviteLink, icon: 'hf/hf19', value: tt('g.invites')},
            {link: blogLink, icon: 'new/blogging', value: tt('g.blog'), addon: <NotifiCounter fields="comment_reply,mention" />},
            {link: donatesLink, icon: 'hf/hf8', value: tt('g.rewards'), addon: <NotifiCounter fields="donate,donate_msgs" />},
            (messagesLink ?
                {link: messagesLink, icon: 'new/envelope', value: tt('g.messages'), target: '_blank', addon: <NotifiCounter fields="message" />} :
                null),
            {link: settingsLink, icon: 'new/setting', value: tt('g.settings')},
            loggedIn ?
                {link: '#', icon: 'new/logout', onClick: goChangeAccount, value: tt('g.change_acc')} :
                {link: '#', onClick: showLogin, value: tt('g.login')}
        ];

        const voting_power_percent = account.get('voting_power') / 100

        return (
            <ul className={mcn + mcl}>
                <LocaleSelect />
                {marketItem}
                {witnessItem}
                <li className="delim show-for-medium" />
                {topbutton}
                {goBlogs}
                {!vertical && goBlogsPencil}
                <li className="delim show-for-medium" />
                <LinkWithDropdown
                    closeOnClickOutside
                    dropdownPosition="bottom"
                    dropdownAlignment="bottom"
                    dropdownContent={<VerticalMenu className={'VerticalMenu_nav-profile'} items={user_menu} />}
                >
                    {!vertical && <li className={'Header__profile'}>
                        <a href={walletLink} title={username} onClick={e => e.preventDefault()}>
                            <Userpic account={username} showProgress={true} votingPower={account.get('voting_power')} progressClass="hide-for-large" />
                            <div className={'NavProfile show-for-large'}>
                                <div className={'NavProfile__name'}>{username}</div>
                                <div className={'NavProfile__golos'}>
                                    {tt('g.voting_capacity')}: <span className={'NavProfile__golos-percent'}>{voting_power_percent}%</span>
                                </div>
                                <div className={'NavProfile__progress'} title={`${voting_power_percent}%`}>
                                    <div className={'NavProfile__progress-percent'} style={{ width: `${voting_power_percent}%` }} />
                                </div>
                            </div>
                        </a>
                        <div className="TopRightMenu__notificounter"><NotifiCounter fields="send,receive,donate,donate_msgs,message,fill_order,comment_reply,mention" /></div>
                    </li>}
                </LinkWithDropdown>
                {navAdditional}
            </ul>
        );
    }

    //fixme - redesign (code duplication with USaga, UProfile)
    let externalTransfer = false;
        if (location) {
        const {pathname} = location;
        const query = locationQueryParams;
        const section = pathname.split(`/`)[2];
        const sender = (section === `transfers`) ? pathname.split(`/`)[1].substring(1) : undefined;
        // /transfers. Check query string
        if (sender && query) {
            const {to, amount, token, memo} = query;
            externalTransfer = (!!to && !!amount && !!token && !!memo);
        }
    }

    return (
        <ul className={mcn + mcl}>
            <LocaleSelect />
            {marketItem}
            {witnessItem}
            <li className="delim show-for-medium" />
            {!probablyLoggedIn && !isLoginPage && !externalTransfer && <li className={scn}>
              <a href="/login" onClick={showLogin} className={!vertical && 'button small violet hollow'}>{tt('g.login')}</a>
            </li>}
            {!probablyLoggedIn && <li className={scn}>
              <a href={registerUrl} className={!vertical && 'button small alert'}>{tt('g.sign_up')}</a>
            </li>}
            {probablyLoggedIn && <li className={lcn}>
              <LoadingIndicator type="circle" inline />
            </li>}
            {navAdditional}
        </ul>
    );
}

TopRightMenu.propTypes = {
    username: PropTypes.string,
    loggedIn: PropTypes.bool,
    probablyLoggedIn: PropTypes.bool,
    showLogin: PropTypes.func.isRequired,
    goChangeAccount: PropTypes.func.isRequired,
    vertical: PropTypes.bool,
    navigate: PropTypes.func,
};

export default connect(
    state => {
        if (!process.env.BROWSER) {
            return {
                username: null,
                loggedIn: false,
                probablyLoggedIn: !!state.offchain.get('account')
            }
        }
        const username = state.user.getIn(['current', 'username']);
        const account  = state.global.getIn(['accounts', username]);
        const loggedIn = !!username;

        const savings_withdraws = state.user.get('savings_withdraws');
        let price_per_golos = undefined;
        const feed_price = state.global.get('feed_price');
        if(feed_price && feed_price.has('base') && feed_price.has('quote')) {
            const {base, quote} = feed_price.toJS()
            if(/ GBG$/.test(base) && / GOLOS$/.test(quote))
                price_per_golos = parseFloat(base.split(' ')[0]) / parseFloat(quote.split(' ')[0])
        }
        const globalprops = state.global.get('props');

        return {
            account,
            username,
            loggedIn,
            savings_withdraws,
            price_per_golos,
            globalprops,
            probablyLoggedIn: false
        }
    },
    dispatch => ({
        showLogin: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.showLogin())
        },
        goChangeAccount: (e) => {
            if (e) e.preventDefault()
            dispatch(user.actions.showChangeAccount())
        },
        toggleNightmode: (e) => {
            if (e) e.preventDefault();
            dispatch(user.actions.toggleNightmode());
        },
    })
)(TopRightMenu);
