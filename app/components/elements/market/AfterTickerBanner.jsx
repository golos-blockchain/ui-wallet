import React from 'react';
import tt from 'counterpart';
import { Link } from 'react-router';

import Icon from 'app/components/elements/Icon'
import { withScreenSize } from 'app/utils/ScreenSize'

class AfterTickerBanner extends React.Component {
	render() {
        const { isS, sym1, sym2 } = this.props
        if (!isS) {
        	return null
        }
        return <div className="row">
            <div className="column small-12">
            	<p className="text-center"><Icon name="info_o" /> {tt('market_jsx.smart_exchange_banner')}
            		<b><Link to={`/convert/${sym1}/${sym2}`}>{tt('market_jsx.smart_exchange_banner2')}</Link></b>
            	</p>
            </div>
        </div>
	}
}

export default withScreenSize(AfterTickerBanner)
