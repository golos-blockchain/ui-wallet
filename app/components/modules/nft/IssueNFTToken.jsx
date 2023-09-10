import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Asset, validateAccountName } from 'golos-lib-js/lib/utils'

import Expandable from 'app/components/elements/Expandable'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import transaction from 'app/redux/Transaction'

class IssueNFTToken extends Component {
    state = {
        token: {
            name: '',
            to: '',
            title: '',
            json_metadata: '{}',
        }
    }

    initTo = (currentUser) => {
        if (!currentUser) return
        const username = currentUser.get('username')
        this.setState({
            token: {
                ...this.state.token,
                to: username
            }
        })
    }

    componentDidMount() {
        this.initTo(this.props.currentUser)
    }

    componentDidUpdate(prevProps) {
        const { currentUser } = this.props
        if (currentUser && !prevProps.currentUser) {
            this.initTo(currentUser)
        }
    }

    validate = (values) => {
        const errors = {}
        const { title, to } = values
        if (!title.length) {
            errors.title = tt('g.required')
        }
        const accNameError = validateAccountName(values.to)
        if (accNameError.error) {
            errors.to = tt('account_name.' + accNameError.error)
        }
        let meta = values.json_metadata
        try {
            meta = JSON.parse(meta)
            if (Array.isArray(meta)) throw new Error('JSON is array')
        } catch (err) {
            console.error('json_metadata', err)
            errors.json_metadata = tt('create_nft_collection_jsx.json_wrong')
            meta = null
        }
        if (meta) {
            const noFields = []
            if (!('title' in meta)) noFields.push('title')
            if (values.image && !('image' in meta)) noFields.push('image')
            if (values.description && !('description' in meta)) noFields.push('description')
            if (noFields.length) {
                errors.json_metadata = tt('create_nft_collection_jsx.json_no_fields')
                errors.json_metadata += noFields.join(', ') + '. '
            }
        }
        return errors
    }

    setSubmitting = (submitting) => {
        this.setState({ submitting })
    }

    _onSubmit = async (values) => {
        this.setSubmitting(true)
        this.setState({
            errorMessage: ''
        })
        const { currentUser, issueName } = this.props
        const username = currentUser.get('username')
        await this.props.issueToken(issueName, values.to, values.json_metadata, currentUser, () => {
            this.props.fetchState()
            this.props.onClose()
            this.setSubmitting(false)
        }, (err) => {
            console.error(err)
            this.setSubmitting(false)
            this.setState({
                errorMessage: err.toString()
            })
        })
    }

    _renderSubmittingIndicator = () => {
        const { submitting } = this.state

        return submitting ? <span className='submitter'>
            <LoadingIndicator type='circle' />
        </span> : null
    }

    updateJSONMetadata = (values, setFieldValue, currentVals, force = false) => {
        let { json_metadata } = values
        try {
            json_metadata = JSON.parse(json_metadata)
            if (Array.isArray(json_metadata)) {
                json_metadata = {}
            }
        } catch (err) {
            console.error('updateJSONMetadata', err)
            if (!force) {
                return
            }
            json_metadata = {}
        }

        const title = currentVals.title || values.title
        json_metadata.title = title || ''

        const description = currentVals.description || values.description
        if (description) {
            json_metadata.description = description
        }

        const image = currentVals.image || values.image
        if (image) {
            json_metadata.image = image
        }

        setFieldValue('json_metadata', JSON.stringify(json_metadata, null, 2))
    }

    onTitleChange = (e, values, setFieldValue) => {
        const title = e.target.value
        setFieldValue('title', title)
        this.updateJSONMetadata(values, setFieldValue, { title })
    }

    onDescriptionChange = (e, values, setFieldValue) => {
        const description = e.target.value
        setFieldValue('description', description)
        this.updateJSONMetadata(values, setFieldValue, { description })
    }

    onImageChange = (e, values, setFieldValue) => {
        const image = e.target.value
        setFieldValue('image', image)
        this.updateJSONMetadata(values, setFieldValue, { image })
    }

    onImageBlur = (e) => {
        e.preventDefault()
        this.setState({
            showImage: true
        })
    }

    restoreJson = (e, values, setFieldValue) => {
        e.preventDefault()
        this.updateJSONMetadata(values, setFieldValue, {}, true)
    }

    fixJson = (e, values, setFieldValue) => {
        e.preventDefault()
        this.updateJSONMetadata(values, setFieldValue, {})
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

    render() {
        const { issueName, issueNum, cprops, onClose, } = this.props;
        const { submitting, showImage, errorMessage } = this.state

        return (<div className='IssueNFTToken'>
            <CloseButton onClick={onClose} />
            <h4>
                {tt('issue_nft_token_jsx.title') + ' (' + issueName + ', #' + issueNum + ')'}
            </h4>
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
                let cost = null
                if (cprops) {
                    let issueCost = Asset(cprops.get('nft_issue_cost'))
                    const multiplier = Math.floor(values.json_metadata.length / 1024)
                    issueCost = issueCost.plus(issueCost.mul(multiplier))
                    cost = <div className='row'>
                        {tt('issue_nft_token_jsx.issue_cost')}&nbsp;
                        <b>{issueCost.floatString}</b>
                        .
                    </div>
                }

                return (
            <Form onMouseUp={this.onMouseUp}>
                <div className='row'>
                    <div className='column small-12'>
                        {tt('create_nft_collection_jsx.coll_title') + '*'}
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='title' type='text' autoFocus
                                onChange={(e) => this.onTitleChange(e, values, setFieldValue)} />
                        </div>
                        <ErrorMessage name='title' component='div' className='error' />
                    </div>
                </div>
                <div>
                    {tt('assets_jsx.transfer_new_owner')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='to' type='text' />
                        </div>
                        <ErrorMessage name='to' component='div' className='error' />
                    </div>
                </div>
                <div>
                    {tt('create_nft_collection_jsx.coll_descr')}
                    {' '}
                    {tt('create_nft_collection_jsx.not_required')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='description' type='text'
                                onChange={(e) => this.onDescriptionChange(e, values, setFieldValue)} />
                        </div>
                        <ErrorMessage name='description' component='div' className='error' />
                    </div>
                </div>
                <div>
                    {tt('create_nft_collection_jsx.image')}
                    {' '}
                    {tt('create_nft_collection_jsx.not_required')}
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='image' type='text' onBlur={this.onImageBlur}
                                onChange={(e) => this.onImageChange(e, values, setFieldValue)} />
                            <img src={values.image || 'empty'} className='image-preview' style={{ visibility: (showImage && values.image) ? 'visible' : 'hidden' }} />
                        </div>
                        <ErrorMessage name='image' component='div' className='error' />
                    </div>
                </div>
                <div className='row'>
                    <Expandable title={tt('create_nft_collection_jsx.json_metadata')}>
                        <div className='column small-12'>
                            <div className='input-group' style={{marginBottom: 5}}>
                                <Field name='json_metadata' type='text' as='textarea' className='json_metadata' />
                            </div>
                        </div>
                    </Expandable>
                </div>
                <div className='row'>
                    <div className='column small-12'>
                        <ErrorMessage name='json_metadata' component='span' className='error json-error' />
                        {(touched.json_metadata && errors.json_metadata) ?
                            (errors.json_metadata === tt('create_nft_collection_jsx.json_wrong') ?
                                <a href='#' onClick={(e) => this.restoreJson(e, values, setFieldValue)}>{tt('create_nft_collection_jsx.restore_json')}</a> :
                                <a href='#' onClick={(e) => this.fixJson(e, values, setFieldValue)}>{tt('create_nft_collection_jsx.json_fix')}</a>)
                        : null}
                    </div>
                </div>
                {cost}
                {(errorMessage && errorMessage !== 'Canceled') ? <div className='row'>
                    <div className='column small-12'>
                        <div className='error' style={{marginBottom:'0px'}}>{errorMessage}</div>
                    </div>
                </div> : null}
                <div className='row' style={{ marginTop: '0.5rem' }}>
                    <div className='column small-8'>
                        <button type='submit' disabled={!isValid || submitting} className='button'>
                            {tt('transfer_jsx.issue')}
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
        </div>)
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {locationBeforeTransitions: {pathname}} = state.routing;
        let currentUser = ownProps.currentUser || state.user.getIn(['current']) 
        if (!currentUser) {
            const currentUserNameFromRoute = pathname.split(`/`)[1].substring(1);
            currentUser = Map({username: currentUserNameFromRoute});
        }
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')]);
        const cprops = state.global.get('cprops')
        return { ...ownProps, currentUser, currentAccount, cprops, }
    },

    dispatch => ({
        issueToken: (
            name, to, json_metadata, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            let json = JSON.parse(json_metadata)
            json = JSON.stringify(json)
            const operation = {
                creator: username,
                name,
                to,
                json_metadata: json,
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_issue',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(IssueNFTToken)
