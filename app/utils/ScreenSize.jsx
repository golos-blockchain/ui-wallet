import React from 'react'

const isScreenS = () => {
    const res = window.matchMedia('screen and (max-width: 39.9375em)').matches
    return res
}

const hideMainMe = '925px'
const hideBlogMe = '600px'
const hideRewardsMe = '520px'

const hideMainFor = '404px'
const hideBlogFor = '354px'
const hideRewardsFor = '330px'

const hideUiaInfo = '720px'
const smallUias = '450px'

const isSmaller = (val) => {
    const res = window.matchMedia('screen and (max-width: ' + val + ')').matches
    return res
}

export const withScreenSize = (WrappedComponent) => {
    class ScreenSize extends React.Component {
        state = {}

        componentDidMount() {
            this.updateSize()
            window.addEventListener('resize', this.onResize)
        }

        componentWillUnmount() {
            window.removeEventListener('resize', this.onResize)
        }

        onResize = () => {
            this.updateSize()
        }

        updateSize = () => {
            this.setState({
                _isSmall: isScreenS(),
                _hideMainMe: isSmaller(hideMainMe),
                _hideBlogMe: isSmaller(hideBlogMe),
                _hideRewardsMe: isSmaller(hideRewardsMe),
                _hideMainFor: isSmaller(hideMainFor),
                _hideBlogFor: isSmaller(hideBlogFor),
                _hideRewardsFor: isSmaller(hideRewardsFor),
                _hideUiaInfo: isSmaller(hideUiaInfo),
                _smallUias: isSmaller(smallUias),
            })
        }

        render() {
            const { _hideMainMe, _hideBlogMe, _hideRewardsMe,
                _hideMainFor, _hideBlogFor, _hideRewardsFor, _hideUiaInfo, _smallUias } = this.state
            return (
                <WrappedComponent
                    isS={this.state._isSmall}
                    hideMainMe={_hideMainMe}
                    hideBlogMe={_hideBlogMe}
                    hideRewardsMe={_hideRewardsMe}
                    hideMainFor={_hideMainFor}
                    hideBlogFor={_hideBlogFor}
                    hideRewardsFor={_hideRewardsFor}
                    hideUiaInfo={_hideUiaInfo}
                    smallUias={_smallUias}
                    {...this.props}
                />
            )
        }
    }

    return ScreenSize
}
