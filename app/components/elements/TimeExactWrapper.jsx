/* eslint react/prop-types: 0 */
import React from 'react';
import tt from 'counterpart'

import Tooltip from 'app/components/elements/Tooltip';

const SECOND = 1000
const MINUTE = 60*SECOND
const HOUR = 60*MINUTE
const DAY = 24*HOUR

function formatTimeExact(dt, maxDepth = 2) {
    const msec = +dt
    const now = Date.now()

    const formatMsec = (ms, depth = 1, prev = null) => {
        if (depth > maxDepth) return ''
        if (ms >= DAY) {
            const days = Math.floor(ms / DAY)
            const remainder = ms % DAY
            const res = days ? days + tt('time_exact_wrapper_jsx.days') : ''
            return res + formatMsec(remainder, ++depth, DAY)
        } else if (ms >= HOUR && (!prev || prev == DAY)) {
            const hours = Math.floor(ms / HOUR)
            const remainder = ms % HOUR
            const res = hours ? hours + tt('time_exact_wrapper_jsx.hours') : ''
            return res + formatMsec(remainder, ++depth, HOUR)
        } else if (ms >= MINUTE && (!prev || prev == HOUR)) {
            const minutes = Math.floor(ms / MINUTE)
            const remainder = ms % MINUTE
            const res = minutes ? minutes + tt('time_exact_wrapper_jsx.minutes') : ''
            return res + formatMsec(remainder, ++depth, MINUTE)
        } else if (!prev || prev == MINUTE) {
            const secs = Math.floor(ms / SECOND)
            return secs ? secs + tt('time_exact_wrapper_jsx.secs') : ''
        } else {
            return ''
        }
    }

    const deltaSign = now - msec
    const delta = Math.abs(deltaSign)

    const result = formatMsec(delta)
    return {
        result,
        ago: deltaSign > 0
    }
}

export default class TimeExactWrapper extends React.Component {
    updateState = () => {
        let { date } = this.props
        if (date && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(date)) {
            date = date + 'Z' // Firefox really wants this Z (Zulu)
        }
        const dt = new Date(date)
        const state = {
            dt,
            ...formatTimeExact(dt)
        }
        this.setState(state)
        return state
    }

    componentDidMount() {
        this.updateState()
    }

    componentDidUpdate(prevProps) {
        if (this.props.date !== prevProps.date)
            this.updateState()
    }

    render() {
        const { className } = this.props
        let state = this.state
        state = state || this.updateState()
        const { dt, result } = state
        return <Tooltip t={dt.toLocaleString()} className={className}>
            {result}
        </Tooltip>
    }
}
