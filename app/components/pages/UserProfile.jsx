/* eslint react/prop-types: 0 */
import React from 'react';
import { Link } from 'react-router';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import golos from 'golos-lib-js';
import tt from 'counterpart';
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown'

import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import Icon from 'app/components/elements/Icon'
import UserKeys from 'app/components/elements/UserKeys';
import CreateAsset from 'app/components/modules/uia/CreateAsset';
import Assets from 'app/components/modules/uia/Assets';
import UpdateAsset from 'app/components/modules/uia/UpdateAsset';
import TransferAsset from 'app/components/modules/uia/TransferAsset';
import NFTCollections from 'app/components/modules/nft/NFTCollections'
import NFTTokens from 'app/components/modules/nft/NFTTokens'
import Invites from 'app/components/elements/Invites';
import PasswordReset from 'app/components/elements/PasswordReset';
import UserWallet from 'app/components/modules/UserWallet';
import WitnessProps from 'app/components/modules/WitnessProps';
import Settings from 'app/components/modules/Settings';
import DonatesFrom from 'app/components/modules/DonatesFrom';
import DonatesTo from 'app/components/modules/DonatesTo';
import CurationRewards from 'app/components/modules/CurationRewards';
import AuthorRewards from 'app/components/modules/AuthorRewards';
import FilledOrders from 'app/components/modules/FilledOrders'
import NFTHistory from 'app/components/modules/nft/NFTHistory'
import NFTMyOrders from 'app/components/modules/nft/NFTMyOrders'
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import { authUrl, } from 'app/utils/AuthApiClient'
import { getGameLevel } from 'app/utils/GameUtils'
import { msgsHost, msgsLink } from 'app/utils/ExtLinkUtils'
import { blogsUrl, blogsTarget, } from 'app/utils/blogsUtils'
import {isFetchingOrRecentlyUpdated} from 'app/utils/StateFunctions';
import {repLog10} from 'app/utils/ParsersAndFormatters';
import { proxifyImageUrl } from 'app/utils/ProxifyUrl';
import Tooltip from 'app/components/elements/Tooltip';
import LiteTooltip from 'app/components/elements/LiteTooltip';
import VerticalMenu from 'app/components/elements/VerticalMenu';
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead';
import NotifiCounter from 'app/components/elements/NotifiCounter';
import DateJoinWrapper from 'app/components/elements/DateJoinWrapper';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Userpic from 'app/components/elements/Userpic';
import Callout from 'app/components/elements/Callout';
import normalizeProfile, { getLastSeen } from 'app/utils/NormalizeProfile';
import { withScreenSize } from 'app/utils/ScreenSize'

export default class UserProfile extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            linksAlign: 'right',
        };
        this.onPrint = () => {window.print()}

        this.loadMore = this.loadMore.bind(this);
        this._onLinkRef = this._onLinkRef.bind(this);
    }

    shouldComponentUpdate(np, ns) {
        const account = np.routeParams.accountname.toLowerCase();

        return (
            np.current_user !== this.props.current_user ||
            np.accounts.get(account) !== this.props.accounts.get(account) ||
            np.wifShown !== this.props.wifShown ||
            np.global_status !== this.props.global_status ||
            np.loading !== this.props.loading ||
            np.location.pathname !== this.props.location.pathname ||
            np.routeParams.accountname !== this.props.routeParams.accountname ||
            np.isS !== this.props.isS ||
            np.hideMainMe !== this.props.hideMainMe ||
            np.hideBlogMe !== this.props.hideBlogMe ||
            np.hideRewardsMe !== this.props.hideRewardsMe ||
            np.hideUiaInfo !== this.props.hideUiaInfo ||
            np.smallUias !== this.props.smallUias ||
            np.hideMainFor !== this.props.hideMainFor ||
            np.hideBlogFor !== this.props.hideBlogFor ||
            np.hideRewardsFor !== this.props.hideRewardsFor ||
            ns.repLoading !== this.state.repLoading
        )
    }

    componentWillUnmount() {
        this.props.clearTransferDefaults()
    }

    loadMore(last_post, category) {
        const {accountname} = this.props.routeParams
        if (!last_post) return;

        let order;
        switch(category) {
          case 'feed': order = 'by_feed'; break;
          case 'blog': order = 'by_author'; break;
          case 'comments': order = 'by_comments'; break;
          case 'recent_replies': order = 'by_replies'; break;
          default: console.log('unhandled category:', category);
        }

        if (isFetchingOrRecentlyUpdated(this.props.global_status, order, category)) return;
        const [author, permlink] = last_post.split('/');
        this.props.requestData({author, permlink, order, category, accountname});
    }

    voteRep = (weight) => {
        let { accountname } = this.props.routeParams;
        let rep = this.props.accounts.get(accountname).get('reputation');
        this.setState({
            repLoading: true,
        }, () => {
            const { current_user, } = this.props;
            const username = current_user ? current_user.get('username') : null;
            this.props.voteRep({
                voter: username, 
                author: accountname,
                weight,
                success: () => {
                    let refreshStart = Date.now();
                    const refresh = () => {
                        this.props.reloadAccounts([accountname, username]);
                        setTimeout(() => {
                            const now = Date.now();
                            const newRep = this.props.accounts.get(accountname).get('reputation');
                            if (newRep === rep && now - refreshStart < 5000) {
                                refresh();
                                return;
                            }
                            this.props.reloadState(window.location.pathname);
                            this.setState({
                                repLoading: false,
                            });
                        }, 500);
                    };
                    refresh();
                },
                error: (err) => {
                    this.setState({
                        repLoading: false,
                    });
                }
            });
        });
    };

    upvoteRep = (e) => {
        e.preventDefault();
        this.voteRep(10000);
    };

    downvoteRep = (e) => {
        e.preventDefault();
        this.voteRep(-10000);
    };

    render() {
        const {
            props: {current_user, current_account, wifShown, global_status,
            isS, hideMainMe, hideBlogMe, hideRewardsMe, hideMainFor, hideBlogFor, hideRewardsFor,
            hideUiaInfo, smallUias, },
            onPrint
        } = this;
        let { accountname, section, id, action } = this.props.routeParams;
        // normalize account from cased params
        accountname = accountname.toLowerCase();
        const username = current_user ? current_user.get('username') : null
        // const gprops = this.props.global.getIn( ['props'] ).toJS();
        if( !section ) section = 'transfers';

        // const isMyAccount = current_user ? current_user.get('username') === accountname : false;

        // Loading status
        const status = global_status ? global_status.getIn([section, 'by_author']) : null;
        const fetching = (status && status.fetching) || this.props.loading;

        let account
        let accountImm = this.props.accounts.get(accountname);
        if( accountImm ) {
            account = accountImm.toJS();
        } else if (fetching) {
            return <div className='UserProfile loader'>
                <div className='UserProfile__center'><LoadingIndicator type='circle' size='40px' /></div>
            </div>;
        } else {
            return <div className='UserProfile'>
                <div className='UserProfile__center'>{tt('user_profile.unknown_account')}</div>
            </div>
        }

        const isMyAccount = username === account.name;

        let rep = golos.formatter.reputation(account.reputation, true);
        rep = parseFloat(rep.toFixed(3));

        let cannotUpvote = false;
        let cannotDownvote = false;
        let upvoteRep = this.upvoteRep;
        let downvoteRep = this.downvoteRep;

        if (current_account && typeof(BigInt) !== 'undefined') { // Safari < 14
            const current_rep = BigInt(current_account.get('reputation'));
            if (current_rep < 0) {
                cannotUpvote = tt('reputation_panel_jsx.cannot_vote_neg_rep');
                cannotDownvote = cannotUpvote;
            } else if (account && current_rep <= BigInt(account.reputation)) {
                cannotDownvote = tt('reputation_panel_jsx.cannot_downvote_lower_rep_ACCOUNT_NAME', {
                    ACCOUNT_NAME: account.name,
                });
            }
            if (cannotUpvote) {
                upvoteRep = (e) => { e.preventDefault(); };
            }
            if (cannotDownvote) {
                downvoteRep = (e) => { e.preventDefault(); };
            }
        }

        let level = null
        if (this.props.gprops) {
            let { levelUrl, levelTitle, levelName } = getGameLevel(accountImm, this.props.gprops)
            level = (<LiteTooltip t={levelTitle}><img className="GameLevel" src={levelUrl} alt={levelName} /></LiteTooltip>)
        }

        let tab_content = null;

        // const global_status = this.props.global.get('status');

        let rewardsClass = '', walletClass = '', permissionsClass = '', nftClass = ''
        if (!section || section === 'transfers') {
            // transfers, check if url has query params
            const { location: { query } } = this.props;
            const {to, amount, token, memo} = query;
            const hasAllParams = (!!to && !!amount && !!token && !!memo);
            walletClass = 'active'
            tab_content = <div>
                <UserWallet
                    transferDetails={{immediate: hasAllParams, ...query}}
                    account={accountImm}
                    showTransfer={this.props.showTransfer}
                    showPowerdown={this.props.showPowerdown}
                    current_user={current_user}
                    withdrawVesting={this.props.withdrawVesting}
                    isS={isS} />
                { isMyAccount && <div><MarkNotificationRead fields='send,receive' account={account.name} /></div> }
                </div>;
        } else if( section === 'assets' ) {
            tab_content = <div>

                <br />
                {!action && <Assets account={accountImm} isMyAccount={isMyAccount}
                    showTransfer={this.props.showTransfer}
                    isS={isS} hideRewardsMe={hideRewardsMe}
                    hideUiaInfo={hideUiaInfo} smallUias={smallUias}
                />}
                {action === 'update' && <UpdateAsset account={accountImm} symbol={id.toUpperCase()} />}
                {action === 'transfer' && <TransferAsset account={accountImm} symbol={id.toUpperCase()} />}
                </div>
        } else if( section === 'create-asset' && isMyAccount ) {
            tab_content = <div>

                <br />
                <CreateAsset account={accountImm} />
                </div>;
        } else if( section === 'nft-collections' ) {
            nftClass = 'active'
            tab_content = <div>
                <NFTCollections account={accountImm} isMyAccount={isMyAccount} />
                </div>
        } else if( section === 'nft-tokens' ) {
            nftClass = 'active'
            tab_content = <div>
                <NFTTokens account={accountImm} isMyAccount={isMyAccount} />
                <MarkNotificationRead fields='nft_receive' account={account.name} />
            </div>
        } else if( section === 'curation-rewards' ) {
            rewardsClass = 'active';
            tab_content = <CurationRewards
                account={account}
                current_user={current_user}
                />
        }
        else if( section === 'author-rewards' ) {
            rewardsClass = 'active';
            tab_content = <AuthorRewards
                account={account}
                current_user={current_user}
                />
        }
        else if( section === 'nft-history' ) {
            nftClass = 'active'
            tab_content = <div>
                <NFTHistory
                    account={account}
                    current_user={current_user}
                />
                <MarkNotificationRead fields='nft_token_sold,nft_buy_offer' account={account.name} />
            </div>
        }
        else if( section === 'nft-orders' ) {
            nftClass = 'active'
            tab_content = <div>
                <NFTMyOrders
                    account={account}
                    current_user={current_user}
                />
            </div>
        }
        else if( section === 'donates-from' ) {
            rewardsClass = 'active';
            tab_content = <DonatesFrom
                account={account}
                current_user={current_user}
                incoming={true}
                />
        }
        else if( section === 'settings' ) {
            tab_content = <Settings routeParams={this.props.routeParams} />
        }
        else if( section === 'donates-to' ) {
            rewardsClass = 'active';
            tab_content = <div>
                <DonatesTo
                    account={account}
                    current_user={current_user}
                    incoming={false}
                    />
                    { isMyAccount && <div><MarkNotificationRead fields='donate,donate_msgs' account={account.name} /></div> }
                </div>
        }
        else if( (section === 'filled-orders')) {
            tab_content = (
                <div>
                    <FilledOrders
                        account={account}
                        current_user={current_user}
                        loading={fetching}
                    />
                    { isMyAccount && <div><MarkNotificationRead fields='fill_order' account={account.name} /></div> }
                </div>
            );
        }
        else if( section === 'permissions' && isMyAccount ) {
            permissionsClass = 'active';
            tab_content = <div>

                <br />
                <UserKeys account={accountImm} />
                { isMyAccount && <div><MarkNotificationRead fields='send,receive' account={account.name} /></div>}
                </div>;
        } 
        else if( section === 'invites' && isMyAccount ) {
            tab_content = <div>

                <br />
                <Invites account={accountImm} />
                </div>;
        } 
        else if( section === 'password' ) {
            permissionsClass = 'active';
            tab_content = <div>

                    <br />
                    <PasswordReset account={accountImm} />
                </div>
        }
        else if( section === 'witness' ) {
            tab_content = <WitnessProps 
                account={account} />
        } 

        if (!(section === 'transfers' ||
              section === 'assets' ||
              section === 'create-asset' ||
              section === 'permissions' ||
              section === 'password' ||
              section === 'invites')) {
            tab_content = <div className='row'>
                <div className='UserProfile__tab_content column'>
                    {tab_content}
                </div>
            </div>;
        }

        let printLink = null;
        if( section === 'permissions' ) {
           if(isMyAccount && wifShown) {
               printLink = <div><a className='float-right noPrint' onClick={onPrint}>
                       <Icon name='printer' />&nbsp;{tt('g.print')}&nbsp;&nbsp;
                   </a></div>
           }
        }

        // const wallet_tab_active = section === 'transfers' || section === 'password' || section === 'permissions' ? 'active' : ''; // className={wallet_tab_active}

        let donates_to_addon = undefined;
        if (isMyAccount) donates_to_addon = <NotifiCounter fields='donate,donate_msgs' />;
        let rewardsMenu = [
            {link: `/@${accountname}/donates-to`, label: tt('g.donates_to'), value: tt('g.donates_to'), addon: donates_to_addon},
            {link: `/@${accountname}/donates-from`, label: tt('g.donates_from'), value: tt('g.donates_from')},
            {link: `/@${accountname}/author-rewards`, label: tt('g.author_rewards'), value: tt('g.author_rewards')},
            {link: `/@${accountname}/curation-rewards`, label: tt('g.curation_rewards'), value: tt('g.curation_rewards')}
        ];

        let nftMenu = [
            {link: `/@${accountname}/nft-tokens`, label: tt('g.nft_tokens'), value: tt('g.nft_tokens'), addon: isMyAccount && <NotifiCounter fields='nft_receive' /> },
            {link: `/@${accountname}/nft-collections`, label: tt('g.nft_collections'), value: tt('g.nft_collections')},
        ];
        if (isMyAccount) {
            nftMenu.push({link: `/@${accountname}/nft-orders`, label: tt('g.nft_orders'), value: tt('g.nft_orders'), })
        }
        nftMenu.push({link: `/@${accountname}/nft-history`, label: tt('g.nft_history'), value: tt('g.nft_history'), addon: isMyAccount && <NotifiCounter fields='nft_token_sold,nft_buy_offer' /> })

        let permissionsMenu = [
            {link: `/@${accountname}/permissions`, label: tt('g.keys'), value: tt('g.keys')},
            {link: `/@${accountname}/password`, label: tt('g.reset_password'), value: tt('g.reset_password')}
        ];

        // set account join date
        let accountjoin = account.created;
        const transferFromSteemToGolosDate = '2016-09-29T12:00:00';
        if (new Date(accountjoin) < new Date(transferFromSteemToGolosDate)) {
          accountjoin = transferFromSteemToGolosDate;
        }

        let hideBlog = isMyAccount ? hideBlogMe : hideBlogFor
        let hideRewards = isMyAccount ? hideRewardsMe : hideRewardsFor
        let blogCounter = isMyAccount && <NotifiCounter fields='comment_reply,mention,referral' />
        let blog
        if (!hideBlog) {
            blog = <a className='UserProfile__menu-item' href={blogsUrl(`/@`) + accountname} target={blogsTarget()}>
                {tt('g.blog')} {blogCounter}
            </a>
        }

        const hideMain = isMyAccount ? hideMainMe : hideMainFor

        let kebab
        let kebabNotify = ''
        if (hideMain) {
            let kebabMenu = []
            if (isMyAccount) {
                kebabMenu = [
                    { link: `/@${accountname}/invites`, label: tt('g.invites'), value: tt('g.invites') },
                    ...permissionsMenu,
                ]
                if (isMyAccount) {
                    kebabMenu.push({ link: `/@${accountname}/settings`, label: tt('g.settings'), value: tt('g.settings') })
                }
            }
            if (hideRewards) {
                kebabMenu = [
                    ...rewardsMenu,
                    { value: '-' },
                    ...kebabMenu,
                ]
                kebabNotify += ',donate,donate_msgs'
            }
            if (hideBlog) {
                kebabMenu = [
                    { link: blogsUrl(`/@`) + accountname, target: blogsTarget(), label: tt('g.blog'), value: tt('g.blog'), addon: blogCounter },
                    { value: '-' },
                    ...kebabMenu,
                ]
                kebabNotify += ',comment_reply,mention,referral'
            }
            if (kebabMenu.length) {
                if (kebabMenu[kebabMenu.length - 1].value === '-') kebabMenu.pop()
            }
            if (kebabNotify[0] === ',') kebabNotify = kebabNotify.slice(1)
            kebab = kebabMenu.length ? <LinkWithDropdown
                closeOnClickOutside
                dropdownPosition='bottom'
                dropdownAlignment='right'
                dropdownContent={<VerticalMenu items={kebabMenu} />}
                >
                <a className={`UserProfile__menu-item`}>
                    <Icon name='new/more' />
                    {(kebabNotify && isMyAccount) ? <NotifiCounter fields={kebabNotify} /> : null}
                </a>
            </LinkWithDropdown> : null
        }

        const top_menu = <div className='row UserProfile__top-menu'>
            <div className='columns'>
                <div className='UserProfile__menu menu' style={{flexWrap: 'wrap'}}>
                    <Link className={`UserProfile__menu-item ${walletClass}`} to={`/@${accountname}`}>
                        {tt('g.balances')}
                    </Link>
                    <Link className='UserProfile__menu-item' to={`/@${accountname}/assets`} activeClassName='active'>
                        {hideMain ? tt('g.assets2') : tt('g.assets')}
                    </Link>
                    <div>
                        <LinkWithDropdown
                            closeOnClickOutside
                            dropdownPosition='bottom'
                            dropdownAlignment={this.state.linksAlign}
                            dropdownContent={<VerticalMenu items={nftMenu} />}
                            >
                            <a className={`${nftClass} UserProfile__menu-item`} ref={this._onLinkRef}>
                                {tt('g.nft')}
                                {isMyAccount && <NotifiCounter fields='nft_receive,nft_token_sold,nft_buy_offer' />}
                                <Icon name='dropdown-center' />
                            </a>
                        </LinkWithDropdown>
                    </div>
                    {isMyAccount ? <Link className='UserProfile__menu-item' to={`/@${accountname}/filled-orders`} activeClassName='active'>
                        {tt('navigation.fill_order')} <NotifiCounter fields="fill_order" />
                    </Link> : null}
                    {!hideMain && isMyAccount && <Link className='UserProfile__menu-item' to={`/@${accountname}/invites`} activeClassName='active'>
                        {tt('g.invites')}
                    </Link>}
                    {!hideMain && isMyAccount && <LinkWithDropdown
                        closeOnClickOutside
                        dropdownPosition='bottom'
                        dropdownAlignment={this.state.linksAlign}
                        dropdownContent={<VerticalMenu items={permissionsMenu} />}
                        >
                        <a className={`${permissionsClass} UserProfile__menu-item`} ref={this._onLinkRef}>
                            {tt('g.permissions')} <Icon name='dropdown-center' />
                        </a>
                    </LinkWithDropdown>}
                    <div className='UserProfile__filler' />
                    <div>
                        {blog}
                        {hideRewards ? null : <LinkWithDropdown
                            closeOnClickOutside
                            dropdownPosition='bottom'
                            dropdownAlignment='right'
                            dropdownContent={<VerticalMenu items={rewardsMenu} />}
                            >
                            <a className={`${rewardsClass} UserProfile__menu-item`} ref={this._onLinkRef}>
                                {tt('g.rewards')}
                                {isMyAccount && <NotifiCounter fields='donate,donate_msgs' />}
                                <Icon name='dropdown-center' />
                            </a>
                        </LinkWithDropdown>}
                        {isMyAccount ? <a target='_blank' rel='noopener noreferrer' className='UserProfile__menu-item' href={msgsLink()} title={tt('g.messages')}>
                            <Icon name='new/envelope' /> <NotifiCounter fields='message' />
                        </a> : null}
                        {isMyAccount && !hideMain && <Link className='UserProfile__menu-item' to={`/@${accountname}/settings`} activeClassName='active' title={tt('g.settings')}>
                            <Icon name='new/setting' />
                        </Link>}
                        {kebab}
                    </div>
                </div>
            </div>
         </div>;

        const { name, location, about, website, cover_image, cover_image_wallet } = normalizeProfile(account)
        const website_label = website ? website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : null

        let cover_image_style = {}
        let cover_image_url = cover_image_wallet || cover_image
        if (cover_image_url) {
            cover_image_url = proxifyImageUrl(cover_image_url)
            cover_image_style = {backgroundImage: 'url(' + cover_image_url + ')'}
        }

        const lastSeen = getLastSeen(account);

        const frozen = account.frozen

        return (
            <div className='UserProfile'>

                {section !== 'witness' && <div className='UserProfile__banner row expanded'>

                    <div className='column' style={cover_image_style}>
                        <div className='UserProfile__buttons-wrapper'>
                            <div className='UserProfile__buttons'>
                                {(msgsHost() && (!username || username !== accountname)) ? <a href={msgsLink(accountname)} target='_blank' rel='noopener noreferrer'><label className='button slim hollow secondary '>{tt('g.write_message')}</label></a> : null}
                            </div>
                        </div>

                        <h1>
                            <Userpic account={account.name} hideIfDefault />
                            {name || account.name}{' '}

                            {!this.state.repLoading && <span className='UserProfile__rep UserProfile__rep-btn' title={tt('user_profile.this_is_users_reputations_score_it_is_based_on_history_of_votes', {name: accountname})}>({rep})</span>}
                            {level}
                        </h1>

                        <div>
                            {about && <p className='UserProfile__bio'>{about}</p>}
                            <p className='UserProfile__info'>
                                {location && <span><Icon name='location' /> {location}</span>}
                                {website && <span><Icon name='link' /> <a href={website}>{website_label}</a></span>}
                                <Icon name='calendar' /> <DateJoinWrapper date={accountjoin} />
                                {lastSeen && <span><Icon name='eye' /> {tt('g.last_seen')} <TimeAgoWrapper date={`${lastSeen}`} /> </span>}
                                {frozen ? <div className='UserProfile__frozen'>
                                    <Icon name='flag' size='1_5x' /> {tt('user_profile.account_frozen')}
                                    &nbsp;
                                    <a href={authUrl('/sign/unfreeze/' + accountname)} target='_blank' rel='noreferrer noopener'>
                                        {tt('g.more_hint')}
                                    </a>
                                </div> : null}
                            </p>
                        </div>
                    </div>
                </div>}
                {section !== 'witness' && <div className='UserProfile__top-nav row expanded noPrint'>
                    {top_menu}
                </div>}
                <div>
                  {/*printLink*/}
                </div>
                <div>
                  {tab_content}
                </div>
            </div>
        );
    }

    _onLinkRef(el) {
        if (el) {
            if (this.state.linksAlign !== 'left' && el.offsetLeft + (el.offsetWidth / 2) < (window.outerWidth / 2)) {
                this.setState({
                    linksAlign: 'left',
                });
            }
        }
    }
}

module.exports = {
    path: '@:accountname(/:section)(/:id)(/:action)',
    component: connect(
        state => {
            const wifShown = state.global.get('UserKeys_wifShown')
            const current_user = state.user.get('current')
            const current_account = current_user && state.global.getIn(['accounts', current_user.get('username')])
            const gprops = state.global.get('props')

            return {
                discussions: state.global.get('discussion_idx'),
                current_user,
                current_account,
                gprops,
                wifShown,
                loading: state.app.get('loading'),
                global_status: state.global.get('status'),
                accounts: state.global.get('accounts'),
            };
        },
        dispatch => ({
            login: () => {dispatch(user.actions.showLogin())},
            clearTransferDefaults: () => {dispatch(user.actions.clearTransferDefaults())},
            showTransfer: (transferDefaults) => {
                dispatch(user.actions.setTransferDefaults(transferDefaults))
                dispatch(user.actions.showTransfer())
            },
            showPowerdown: powerdownDefaults => {
                dispatch(user.actions.setPowerdownDefaults(powerdownDefaults));
                dispatch(user.actions.showPowerdown());
            },
            withdrawVesting: ({account, vesting_shares, errorCallback, successCallback}) => {
                const successCallbackWrapper = (...args) => {
                    dispatch({type: 'FETCH_STATE', payload: {pathname: `@${account}/transfers`}})
                    return successCallback(...args)
                }
                dispatch(transaction.actions.broadcastOperation({
                    type: 'withdraw_vesting',
                    operation: {account, vesting_shares},
                    username: account,
                    errorCallback,
                    successCallback: successCallbackWrapper,
                }))
            },
            voteRep: ({voter, author, weight, success, error}) => {
                const confirm = () => {
                    if (weight < 0) {
                        return tt('reputation_panel_jsx.confirm_downvote_ACCOUNT_NAME', {
                            ACCOUNT_NAME: author,
                        });
                    }
                    return tt('reputation_panel_jsx.confirm_upvote_ACCOUNT_NAME', {
                        ACCOUNT_NAME: author,
                    });
                };
                dispatch(transaction.actions.broadcastOperation({
                    type: 'vote',
                    operation: {
                        voter,
                        author,
                        permlink: '',
                        weight,
                        __config: {title: tt('reputation_panel_jsx.confirm_title'),},
                    },
                    confirm,
                    successCallback: () => {
                        success();
                    },
                    errorCallback: (err) => {
                        error(err);
                    },
                }));
            },
            reloadAccounts: (usernames) => {
                dispatch(user.actions.getAccount({usernames: [...new Set(usernames)]}));
            },
            reloadState: (pathname) => {
                dispatch({type: 'FETCH_STATE', payload: {pathname}});
            },
            requestData: (args) => dispatch({type: 'REQUEST_DATA', payload: args}),
        })
    )(withScreenSize(UserProfile))
};
