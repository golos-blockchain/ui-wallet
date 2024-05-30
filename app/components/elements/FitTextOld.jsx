import React from 'react'

const MAX_SCALE = 6

export default class FitText extends React.Component {
    state = { scale: 0 }

    constructor(props) {
        super(props)
        this.span = React.createRef()
    }

    onRender = () => {
        console.timeEnd('R1')
        const { current } = this.span
        if (!current || this.state.scaled) return
        const width = current.offsetWidth
        const { maxWidth } = this.props
        if (width > maxWidth) {
            const { scale } = this.state
            if (scale === MAX_SCALE) {
                this.setState({
                    scaled: true
                })
                return
            }
            this.setState({
                scale: scale + 1
            })
        } else {
            this.setState({
                scaled: true
            })
        }
    }

    render() {
        let { text, maxWidth, shrink, shrink2 } = this.props
        const { scale } = this.state

        let fontSize
        if (scale === 1) {
            fontSize = '90%'
        } else if (scale === 2) {
            fontSize = '85%'
        } else if (scale >= 3) {
            fontSize = '80%'
            if (shrink)
                text = text.substring(0, shrink - (5 * (scale - 3))) + '...'
        }

        return <span ref={this.span} style={{ fontSize, }}>
        <img style={{ display: 'none' }} src={Math.random().toString()} onLoad={this.onRender} onError={this.onRender} />
        {text}</span>
    }
}
