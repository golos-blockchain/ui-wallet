import React from 'react';
import { Link } from 'react-router';
import NotifiCounter from 'app/components/elements/NotifiCounter';
import tt from 'counterpart';

export default ({account_name, isMyAccount}) => {
    return <div className="row">
        <div className="columns small-10 medium-12 medium-expand left-column">
            <span className="help-wiki"><a target="_blank" href="https://wiki.golos.id/users/welcome/wallet">{tt('g.help_wallet')} (?)</a></span>
        </div>
    </div>
}
