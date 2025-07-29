import React, { PureComponent } from 'react';
import styled, { css } from 'styled-components';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie'

import { LOCALE_COOKIE_KEY, LANGUAGES } from 'app/client_config'
import user from 'app/redux/User'

const HIDE_CHEVRON_WIDTH = 500;

const Wrapper = styled.div`
    position: relative;
    margin-right: 8px;
    cursor: pointer;
    z-index: 1;

    @media (max-width: ${HIDE_CHEVRON_WIDTH}px) {
        margin-right: 0;
    }
`;

const Current = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    height: 48px;
    font-weight: 500;
    text-transform: uppercase;

    @include themify($themes) {
        color: themed('textColorPrimary');
    }

    user-select: none;
    z-index: 1;
`;

const Chevron = styled.div`
    position: absolute;
    top: 22px;
    right: 5px;
    border: 3px solid transparent;
    border-top-color: #363636;

    ${props => props.open && css`
        top: 19px;
        border-top-color: transparent;
        border-bottom-color: #363636;
    `};

    @media (max-width: ${HIDE_CHEVRON_WIDTH}px) {
        display: none;
    }
`;

const List = styled.div`
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 2px;
    left: -6px;
    right: -6px;
    padding: 38px 0 4px;
    border-radius: 8px;
    background: #fff;
    border-color: #3684ff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;

    ${props => props.open && css`
        opacity: 1;
        pointer-events: initial;
    `};

    @media (max-width: 500px) {
        padding-top: 46px;
    }
`;

const ListItem = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 34px;
    font-weight: 500;
    text-transform: uppercase;
    color: #959595;
    cursor: pointer;
    user-select: none;

    &:hover {
        color: #333;
    }

    @media (max-width: 500px) {
        height: 48px;
    }
`;




class LocaleSelect extends PureComponent {
    state = {
        open: false,
    };

    componentWillUnmount() {
        window.removeEventListener('click', this.onAwayClick);
    }

    onRef = el => {
        this.root = el;
    };

    onOpenClick = () => {
        this.toggle(!this.state.open);
    };

    onAwayClick = e => {
        if (!this.root.contains(e.target)) {
            this.toggle(false);
        }
    };

    onLanguageChange = language => {
        const cookies = new Cookies()
        cookies.set(LOCALE_COOKIE_KEY, language, {path: "/", expires: new Date(Date.now() + 60 * 60 * 24 * 365 * 10 * 1000)})
        localStorage.setItem('language', language)
        this.props.changeLanguage(language)
        //this.notify()
    };

    toggle(show) {
        if (show) {
            window.addEventListener('click', this.onAwayClick);
        } else {
            window.removeEventListener('click', this.onAwayClick);
        }

        this.setState({
            open: show,
        });
    }

    render() {
        const { currentUser, locale } = this.props;
        const { open } = this.state;

        // for debug only, remove after fix
        console.warn('locale', locale);

        return (
            <Wrapper ref={this.onRef}>
                <Current onClick={this.onOpenClick}>
                    {locale}
                    <Chevron open={open} />
                </Current>
                <List open={open}>
                    {Object.keys(LANGUAGES)
                        .filter(lang => lang !== locale)
                        .map(lang => (
                            <ListItem
                                key={lang}
                                onClick={() => {
                                    if (currentUser) {
                                        this.props.setSettingsLocale(lang);
                                    }
                                    this.onLanguageChange(lang);
                                }}
                            >
                                {lang}
                            </ListItem>
                        ))}
                </List>
            </Wrapper>
        );
    }
}

export default connect((state, props) => {
    let locale = state.user.get('locale')

    if (process.env.BROWSER) {
        const cookies = new Cookies()
        const l = cookies.get(LOCALE_COOKIE_KEY)
        if (l) locale = l;
    }

    return {
        ...props,
        locale,
    };
}, dispatch => ({
  uploadImage: (file, progress) => {
    dispatch({
      type: 'user/UPLOAD_IMAGE',
      payload: {file, progress},
    })
  },
  changeLanguage: (language) => {
    dispatch(user.actions.changeLanguage(language))
  },
}))(LocaleSelect);
