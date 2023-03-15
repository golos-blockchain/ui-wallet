import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router';
import {connect} from 'react-redux';
import tt from 'counterpart'

import TopRightMenu from 'app/components/modules/TopRightMenu'
import Icon from 'app/components/elements/Icon'
import resolveRoute from 'app/ResolveRoute'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import CMCBar from 'app/components/elements/market/CMCBar'
import CMCSmall from 'app/components/elements/market/CMCSmall'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import normalizeProfile from 'app/utils/NormalizeProfile'
import { detransliterate, capitalizeFirstLetter, } from 'app/utils/ParsersAndFormatters'
import { APP_NAME_UP, APP_ICON, SEO_TITLE, } from 'app/client_config'

function sortOrderToLink(so, topic, account) {
    // to prevent probmes check if topic is not the same as account name
    if ('@' + account == topic) topic = ''
    if (so === 'home') return '/@' + account
    if (topic) return `/${so}/${topic}`;
    return `/${so}`;
}

class Header extends React.Component {
    static propTypes = {
        location: PropTypes.object.isRequired,
        current_account_name: PropTypes.string,
        account_meta: PropTypes.object
    };

    constructor() {
        super();
        this.state = {subheader_hidden: false}
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Header');
        this.hideSubheader = this.hideSubheader.bind(this);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            const route = resolveRoute(nextProps.location.pathname);
            if (route && route.page === 'PostsIndex' && route.params && route.params.length > 0) {
                const sort_order = route.params[0] !== 'home' ? route.params[0] : null;
                if (sort_order) window.last_sort_order = this.last_sort_order = sort_order;
            }
        }
    }

    hideSubheader() {
        const subheader_hidden = this.state.subheader_hidden;
        const y = window.scrollY >= 0 ? window.scrollY : document.documentElement.scrollTop;
        if (y === this.prevScrollY) return;
        if (y < 5) {
            this.setState({subheader_hidden: false});
        } else if (y > this.prevScrollY) {
            if (!subheader_hidden) this.setState({subheader_hidden: true})
        } else {
            if (subheader_hidden) this.setState({subheader_hidden: false})
        }
        this.prevScrollY = y;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.hideSubheader);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.hideSubheader);
    }

    render() {
        const route = resolveRoute(this.props.location.pathname);
        const current_account_name =  this.props.current_account_name;
        let home_account = false;
        let page_title = route.page;

        let sort_order = '';
        let topic = '';
        let topic_original_link = '';
        let user_name = null;
        let page_name = null;

        if (route.page === 'Login') {
            page_title = tt('g.login')
        } else if (route.page == 'ChangePassword') {
            page_title = tt('header_jsx.change_account_password');
        } else if (route.page === 'UserProfile') {
            user_name = route.params[0].slice(1);
            const acct_meta = this.props.account_meta.getIn([user_name]);
            const name = acct_meta ? normalizeProfile(acct_meta.toJS()).name : null;
            const user_title = name ? `${name} (@${user_name})` : user_name;
            page_title = user_title;
            if(route.params[1] === "curation-rewards"){
                page_title = tt('header_jsx.curation_rewards_by') + " " + user_title;
            }
            if(route.params[1] === "author-rewards"){
                page_title = tt('header_jsx.author_rewards_by') + " " + user_title;
            }
            if(route.params[1] === "donates-from"){
                page_title = tt('header_jsx.donates_from') + " " + user_title;
            }
            if(route.params[1] === "donates-to"){
                page_title = tt('header_jsx.donates_to') + " " + user_title;
            }
            if(route.params[1] === "recent-replies"){
                page_title = tt('header_jsx.replies_to') + " " + user_title;
            }
        } else if (route.page === 'ConvertAssetsPage') {
            page_title = tt('g.convert_assets')
        } else {
            page_name = ''; //page_title = route.page.replace( /([a-z])([A-Z])/g, '$1 $2' ).toLowerCase();
        }

        // Format first letter of all titles and lowercase user name
        if (route.page !== 'UserProfile') {
            page_title = page_title.charAt(0).toUpperCase() + page_title.slice(1);
        }

        if (process.env.BROWSER && (route.page !== 'Post' && route.page !== 'PostNoCategory')) document.title = page_title + ' | ' + SEO_TITLE;

        const logo_link = route.params && route.params.length > 1 && this.last_sort_order ? '/' + this.last_sort_order : (current_account_name ? `/@${current_account_name}` : '/');
        let topic_link = topic ? <Link to={`/${this.last_sort_order || 'hot'}/${topic_original_link}`}>{detransliterate(topic)}</Link> : null;

        return (
            <header className="Header noPrint">
                <div className="Header__top header">
                    <div className="row align-middle">
                        <div className="columns">
                            <ul className="menu">
                                <li className="Header__top-logo">
                                    <Link to={logo_link}><img src={$STM_Config.logo.icon} /></Link>
                                </li>
                                <li className="Header__top-steemit show-for-large noPrint">
                                    <Link to={logo_link}><img src={$STM_Config.logo.title} /></Link>
                                </li>
                                <CMCSmall className='show-for-small-only' />
                            </ul>
                        </div>
                        <div className="columns shrink">
                            <TopRightMenu {...this.props} />
                        </div>
                    </div>
                </div>
                <div className={'Header__sub-nav show-for-medium hide-for-small ' + (this.state.subheader_hidden ? ' hidden' : '')}>
                    <div className="row">
                        <div className="columns">
                            <span className="question"><a target="_blank" rel="noopener noreferrer" href="https://golos.chatbro.com"><Icon name="new/telegram" />&nbsp;&nbsp;{tt('g.to_ask')}</a></span>
                            <CMCBar />
                        </div>
                    </div>
                </div>
            </header>
        );
    }
}

export {Header as _Header_};

export default connect(
    state => {
        const current_user = state.user.get('current');
        const account_user = state.global.get('accounts');
        const current_account_name = current_user ? current_user.get('username') : state.offchain.get('account');
        const { routing: {locationBeforeTransitions: { query }}} = state;
        return {
            location: state.app.get('location'),
            locationQueryParams: query,
            current_account_name,
            account_meta: account_user,
        }
    }
)(Header);
