/* eslint react/prop-types: 0 */
import React from 'react';
import {connect} from 'react-redux'
import tt from 'counterpart'

import TransferHistoryRow from 'app/components/cards/TransferHistoryRow'

class NFTHistory extends React.Component {
    state = { historyIndex: 0 }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.account.nft_history) return true;
        if (!nextProps.account.nft_history) return true;
        return (
            nextProps.account.nft_history.length !== this.props.account.nft_history.length ||
            nextState.historyIndex !== this.state.historyIndex);
    }

    _setHistoryPage(back) {
        const newIndex = this.state.historyIndex + (back ? 10 : -10);
        this.setState({historyIndex: Math.max(0, newIndex)});
    }

    render() {
        const {state: {historyIndex}} = this
        const {account, incoming} = this.props;

        const nft_history = account.nft_history || [];

        /// nft log
        let idx = 0
        let nftLog = nft_history.map((item, index) => {
            return <TransferHistoryRow key={idx++} op={item} context={account.name} />;
        }).filter(el => !!el);
        let currentIndex = -1;
        const nftLength = nftLog.length;
        const limitedIndex = Math.min(historyIndex, nftLength - 10);
        nftLog = nftLog.reverse().filter(() => {
            currentIndex++;
            return currentIndex >= limitedIndex && currentIndex < limitedIndex + 10;
        });

         const navButtons = (
             <nav>
               <ul className="pager">
                 <li>
                     <div className={"button tiny hollow float-left " + (historyIndex === 0 ? " disabled" : "")} onClick={this._setHistoryPage.bind(this, false)} aria-label="Previous">
                         <span aria-hidden="true">&larr; {tt('g.newer')}</span>
                     </div>
                 </li>
                 <li>
                     <div className={"button tiny hollow float-right " + (historyIndex >= (nftLength - 10) ? " disabled" : "")} onClick={historyIndex >= (nftLength - 10) ? null : this._setHistoryPage.bind(this, true)} aria-label="Next">
                         <span aria-hidden="true">{tt('g.older')} &rarr;</span>
                     </div>
                 </li>
               </ul>
             </nav>
        );

        return (<div className="UserWallet">
            <div className="row">
                <div className="column small-12">
                    <h4 className="uppercase">{tt('g.nft_history')}</h4>
                    {navButtons}
                    <table>
                        <tbody>
                        {nftLog}
                        </tbody>
                     </table>
                    {navButtons}
                </div>
            </div>
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        return {
            state,
            ...ownProps
        }
    }
)(NFTHistory)
