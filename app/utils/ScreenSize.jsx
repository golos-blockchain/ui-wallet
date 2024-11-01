import React from 'react'

const isScreenS = () => {
    const res = window.matchMedia('screen and (max-width: 39.9375em)').matches
    return res
}

const isScreenXS = () => {
    const res = window.matchMedia('screen and (max-width: 27.0em)').matches
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
            console.log('updateSize')
            this.setState({
                _isSmall: isScreenS(),
                _isXSmall: isScreenXS(),
            })
        }

        render() {
            return (
                <WrappedComponent
                    isS={this.state._isSmall}
                    isXS={this.state._isXSmall}
                    {...this.props}
                />
            )
        }
    }

    return ScreenSize
}
