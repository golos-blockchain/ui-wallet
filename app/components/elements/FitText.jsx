import React from 'react'

const tryIt = (text, fontSize = undefined) => {
    const el = document.createElement('h5')
    el.style.display = 'none'
    const span = document.createElement('span')
    if (fontSize)
        span.style.fontSize = fontSize
    el.appendChild(span)
    document.body.appendChild(el)
    const font1 = getComputedStyle(span).font 
    el.remove()
    const cnv1 = document.createElement('canvas')
    const ctx1 = cnv1.getContext('2d')
    ctx1.font = font1
    return ctx1.measureText(text).width
}

export default class FitText extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    render() {
        let { maxWidth, shrink } = this.props
        let text = this.props.text

        let fontSize, shrinked
        try {
            let width = tryIt(text)
            if (width > maxWidth) {
                fontSize = '90%'
            }
            width = tryIt(text, fontSize)
            if (width > maxWidth) {
                fontSize = '85%'
            }
            width = tryIt(text, fontSize)
            if (width > maxWidth) {
                fontSize = '80%'
                for (let i = 0; i < 10; ++i) {
                    width = tryIt(text, fontSize)
                    if (width > maxWidth) {
                        if (shrink) {
                            text = this.props.text
                            text = text.substring(0, text.length - (2 * i)) + '...'
                            shrinked = true
                        }
                    } else {
                        break
                    }
                }
            }
        } catch (err) {
            console.error('FitText', err)
        }

        return <span style={{ fontSize, }} title={shrinked && this.props.text}>
        {text}</span>
    }
}
