import React, {Component} from 'react'
import tt from 'counterpart'

import Hint from 'app/components/elements/common/Hint'
import VerticalMenu from 'app/components/elements/VerticalMenu'

class NFTTokenSellPopup extends Component {
    state = { show: false }

    constructor() {
        super()
    }

    componentWillUnmount() {
        this._unmount = true

        if (this._onAwayClickListen) {
            window.removeEventListener('mousedown', this._onAwayClick)
        }
    }

    _popupVisibleRef = el => {
        this._popupVisible = el
    }

    _onAwayClick = e => {
        if (!this._popupVisible || !this._popupVisible.contains(e.target)) {
            setTimeout(() => {
                if (!this._unmount) {
                    this.setState({
                        show: false,
                    });
                }
            }, 50);
        }
    };

    togglePopup = () => {
        this.setState({
            show: !this.state.show
        },
        () => {
            const { show } = this.state

            if (show && !this._onAwayClickListen) {
                window.addEventListener('mousedown', this._onAwayClick)
                this._onAwayClickListen = true
            }
        })
    }

    hidePopup = () => {
        this.setState({
            show: false
        })
    }

    showSell = (e) => {
        e.preventDefault()
        const { showSell } = this.props
        if (showSell) showSell(e)
        this.hidePopup()
    }

    showAuction = (e) => {
        e.preventDefault()
        const { showAuction } = this.props
        if (showAuction) showAuction(e)
        this.hidePopup()
    }

    render() {
        const sellItems = [
            {link: '#', label: tt('nft_tokens_jsx.sell_fix_price'), value: 'sell_fix_price',
                onClick: this.showSell },
        ]

        const { is_auction } = this.props
        if (!is_auction) {
            sellItems.push(
                {link: '#', label: tt('nft_tokens_jsx.start_auction'), value: 'start_auction',
                    onClick: this.showAuction })
        }

        const { show } = this.state
        if (!show) return null
        return <Hint align={this.props.align} innerRef={this._popupVisibleRef} className='PostFooter__visible-hint'>
            <VerticalMenu items={sellItems} />
        </Hint>
    }
}

export default NFTTokenSellPopup