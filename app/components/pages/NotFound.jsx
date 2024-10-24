import React from 'react';
import { Link } from 'react-router';

import Icon from 'app/components/elements/Icon.jsx';
import { APP_NAME, APP_ICON } from 'app/client_config';
import { hrefClick } from 'app/utils/app/RoutingUtils'

class NotFound extends React.Component {

    render() {
        return (
            <div className="NotFound float-center">
                <div>
                    <br />
                    <Icon name={APP_ICON} size="4x" />
                    <h4 className="NotFound__header">Sorry! This page doesn't exist.</h4>
                    <p>Not to worry. You can head back to <a style={{fontWeight: 800}} href="/">our homepage</a>,
                       or check out some great posts.
                    </p>
                    <ul className="NotFound__menu">
                      <li><a href="/transfers" onClick={hrefClick}>balances</a></li>
                      <li><a href="/assets" onClick={hrefClick}>uia-assets</a></li>
                      <li><a href="/donates-to" onClick={hrefClick}>rewards</a></li>
                      <li><a href="/rating" onClick={hrefClick}>market</a></li>
                    </ul>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: '*',
    component: NotFound
};
