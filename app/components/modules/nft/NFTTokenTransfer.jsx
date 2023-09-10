import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { validateAccountName } from 'golos-lib-js/lib/utils'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import transaction from 'app/redux/Transaction'

class NFTTokenTransfer extends Component {
    state = {
        token: {
            to: ''
        }
    }

    validate = (values) => {
        const errors = {}
        const { to } = values
        const accNameError = validateAccountName(values.to)
        if (accNameError.error) {
            errors.to = tt('account_name.' + accNameError.error)
        }
        return errors
    }

    setSubmitting = (submitting) => {
        this.setState({ submitting })
    }

    getToken = () => {
        const { nft_tokens, tokenIdx } = this.props
        if (tokenIdx !== undefined) {
            return nft_tokens.toJS().data[tokenIdx]
        }
        return this.props.token
    }

    _onSubmit = async (values) => {
        this.setSubmitting(true)
        this.setState({
            errorMessage: ''
        })

        const { currentUser, onClose, } = this.props
        const token = this.getToken()
        const { token_id } = token

        const username = currentUser.get('username')

        await this.props.transferToken(token_id, values.to, currentUser, () => {
            this.props.onClose()
            this.setSubmitting(false)
            this.doNotRender = true
            this.props.refetch()
        }, (err) => {
            console.error(err)
            this.setSubmitting(false)
            this.setState({
                errorMessage: err.toString()
            })
        })
    }

    onCancelMouseDown = (e) => {
        e.preventDefault()
        this.setState({
            cancelMouseDown: true
        })
    }

    onCancelMouseUp = (e) => {
        e.preventDefault()
        if (this.state.cancelMouseDown) {
            this.props.onClose()
            this.setState({
                cancelMouseDown: false
            })
        }
    }

    onMouseUp = (e) => {
        e.preventDefault()
        if (this.state.cancelMouseDown) {
            this.props.onClose()   
        }
    }

    _renderSubmittingIndicator = () => {
        const { submitting } = this.state

        return submitting ? <span className='submitter'>
            <LoadingIndicator type='circle' />
        </span> : null
    }

    render() {
        if (this.doNotRender) {
            return <LoadingIndicator type='circle' />
        }

        const { onClose, } = this.props

        const token = this.getToken()

        const { json_metadata, image } = token

        let data
        if (json_metadata) {
            data = JSON.parse(json_metadata)
        }
        data = data || {} // node allows to use '', null, object, or array

        const { errorMessage, submitting  } = this.state

        return <div className='NFTTokenTransfer'>
            <CloseButton onClick={onClose} />
            <h4>{tt('g.transfer')}</h4>
            <div style={{ marginBottom: '0.5rem' }}>
                <NFTSmallIcon image={image} />
                <span style={{ display: 'inline-block', marginTop: '13px', marginLeft: '0.5rem' }}>{data.title}</span>
            </div>
            <Formik
                initialValues={this.state.token}
                enableReinitialize={true}
                validate={this.validate}
                validateOnMount={true}
                onSubmit={this._onSubmit}
            >
            {({
                handleSubmit, isValid, values, errors, touched, setFieldValue, handleChange,
            }) => {
                return (
            <Form onMouseUp={this.onMouseUp}>
                <div>
                    {tt('assets_jsx.transfer_new_owner')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='to' type='text' autoFocus />
                        </div>
                        <ErrorMessage name='to' component='div' className='error' />
                    </div>
                </div>
                {(errorMessage && errorMessage !== 'Canceled') ? <div className='row'>
                    <div className='column small-12'>
                        <div className='error' style={{marginBottom:'0px'}}>{errorMessage}</div>
                    </div>
                </div> : null}
                <div className='row' style={{ marginTop: '0.5rem' }}>
                    <div className='column small-8'>
                        <button type='submit' disabled={!isValid || submitting} className='button'>
                            {tt('g.transfer')}
                        </button>
                        <button type='button' disabled={submitting} className='button hollow'
                                onMouseDown={this.onCancelMouseDown} onMouseUp={this.onCancelMouseUp}>
                            {tt('g.cancel')}
                        </button>
                        {this._renderSubmittingIndicator()}
                    </div>
                </div>
            </Form>
            )}}</Formik>
        </div>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        return { ...ownProps,
            nft_tokens: state.global.get('nft_tokens'),
        }
    },

    dispatch => ({
        transferToken: (
            token_id, to, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            const operation = {
                from: username,
                to,
                token_id,
                memo: ''
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_transfer',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(NFTTokenTransfer)
