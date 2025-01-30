import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import transaction from 'app/redux/Transaction'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import {Map} from 'immutable'

const {func, string} = PropTypes

/** Sole consumer for a transaction error of a given type. */
class TransactionError extends React.Component {
    static propTypes = {
        // HTML properties
        opType: string.isRequired,
        error: string, // additional error (optional)
        unhandled: string, // (optional)

        // Redux connect properties
        addListener: func.isRequired,
        removeListener: func.isRequired,
        errorKey: string,
        exception: string,
    }
    UNSAFE_componentWillMount() {
        const {opType, addListener} = this.props
        addListener(opType)
    }
    shouldComponentUpdate = shouldComponentUpdate(this, 'TransactionError')
    componentWillUnmount() {
        const {opType, removeListener} = this.props
        removeListener(opType)
    }
    render() {
        const{errorKey, exception, error, unhandled} = this.props
        const cn = "error callout alert"
        if(!errorKey && !exception) {
            if(!error) return <span></span>
                return (
                    <span className="TransactionError">
                        <div className={cn}>{error}{JSON.stringify({
                            errorKey, exception, error
                        })}</div>
                    </span>
                )
        }
        const text = (errorKey ? errorKey : exception)
        let details
        if (unhandled === 'detailed' && exception) {
            details = <div>{exception.toString().substring(0, 150)}</div>
        }
        return (
            <span className="TransactionError">
                <div className={cn}>{text}{details}</div>
            </span>
        )
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {opType} = ownProps
        const error = state.transaction.getIn(['TransactionError', opType]) || Map()
        const {key, exception} = error.toJS()
        return {
            ...ownProps,
            errorKey: key, exception,
        }
    },
    // mapDispatchToProps
    dispatch => ({
        addListener: (opType) => {
            dispatch(transaction.actions.set({key: ['TransactionError', opType + '_listener'], value: true}))
        },
        removeListener: (opType) => {
            dispatch(transaction.actions.remove({key: ['TransactionError', opType]}))
            dispatch(transaction.actions.remove({key: ['TransactionError', opType + '_listener']}))
        },
    })
)(TransactionError)
