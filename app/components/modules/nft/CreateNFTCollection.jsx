import React, { Component, } from 'react'
import tt from 'counterpart'
import { connect, } from 'react-redux'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import { Formik, Form, Field, ErrorMessage, } from 'formik'

import Expandable from 'app/components/elements/Expandable'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import transaction from 'app/redux/Transaction'

const UINT32_MAX = '4294967295'

class CreateNFTCollection extends Component {
    state = {
        collection: {
            name: '',
            title: '',
            json_metadata: '{}',
            max_token_count: UINT32_MAX,
            infinity: true
        }
    }

    validate = (values) => {
        const errors = {}
        const { title, name } = values
        if (!title.length) {
            errors.title = tt('g.required')
        }
        if (name.length < 3) {
            errors.name = tt('assets_jsx.symbol_too_short')
        } else {
            const parts = name.split('.')
            if (parts[0] == 'GOLOS' || parts[0] == 'GBG' || parts[0] == 'GESTS') {
                errors.name = tt('assets_jsx.top_symbol_not_your')
            } else if (parts.length == 2 && parts[1].length < 3) {
                errors.name = tt('assets_jsx.subsymbol_too_short')
            }
        }
        let meta = values.json_metadata
        try {
            meta = JSON.parse(meta)
            if (!meta || Array.isArray(meta)) throw new Error('JSON is array')
        } catch (err) {
            console.error('json_metadata', err)
            //errors.json_metadata = tt('create_nft_collection_jsx.json_wrong')
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
        ++this.validationTime
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
        const { currentUser } = this.props
        const username = currentUser.get('username')
        await this.props.createCollection(values.name, values.json_metadata, values.max_token_count, currentUser, () => {
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

    onNameChange = (e, values, setFieldValue) => {
        let newName = ''
        let hasDot
        for (let i = 0; i < e.target.value.length; ++i) {
            const c = e.target.value[i]
            if ((c < 'a' || c > 'z') && (c < 'A' || c > 'Z') && c !== '.') {
                continue
            }
            if (c == '.') {
                if (i < 3 || hasDot) {
                    continue
                }
                hasDot = true
            }
            newName += c.toUpperCase()
        }
        setFieldValue('name', newName)
    }

    updateJSONMetadata = (values, setFieldValue, currentVals, force = false) => {
        let { json_metadata } = values
        try {
            json_metadata = JSON.parse(json_metadata)
            if (json_metadata === null || Array.isArray(json_metadata)) {
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

    onMaxTokenCountChange = (e, setFieldValue) => {
        let maxTokenCount = ''
        for (let i = 0; i < e.target.value.length; ++i) {
            const c = e.target.value[i]
            if (c < '0' || c > '9') {
                continue
            }
            maxTokenCount += c
        }
        if (maxTokenCount === UINT32_MAX) {
            setFieldValue('infinity', true)
        }
        setFieldValue('max_token_count', maxTokenCount)
    }

    onInfinityChange = (e, values, setFieldValue) => {
        if (!values.infinity) {
            setFieldValue('max_token_count', UINT32_MAX)
            setFieldValue('infinity', !values.infinity)
        } else {
            setFieldValue('max_token_count', '')
            setFieldValue('infinity', !values.infinity)
        }
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
        const { onClose, } = this.props;
        const { submitting, showImage, errorMessage, hideErrors } = this.state

        return (<div className='CreateNFTCollection'>
            <CloseButton onClick={onClose} />
            <h4>
                {tt('create_nft_collection_jsx.title')}
            </h4>
            <Formik
                initialValues={this.state.collection}
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
                <div className='row'>
                    <div className='column small-5'>
                        {tt('create_nft_collection_jsx.name') + '*'}
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='name' type='text' maxLength='14' autoFocus={true} 
                                onChange={(e) => this.onNameChange(e, values, setFieldValue)} />
                        </div>
                    </div>
                    <div className='column small-7 padding-left'>
                        {tt('create_nft_collection_jsx.coll_title') + '*'}
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='title' type='text'
                                onChange={(e) => this.onTitleChange(e, values, setFieldValue)} />
                        </div>
                        {!errors.name && <ErrorMessage name='title' component='div' className='error' />}
                    </div>
                    {!hideErrors && <ErrorMessage name='name' component='div' className='error' />}
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
                <div>
                    {tt('create_nft_collection_jsx.token_count')}
                </div>
                <div className='row'>
                    <div className='column small-6'>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='max_token_count' disabled={values.max_token_count === UINT32_MAX}
                                type='text' value={values.max_token_count !== UINT32_MAX ?
                                    values.max_token_count : ''}
                                onChange={e => this.onMaxTokenCountChange(e, setFieldValue)}
                            />
                        </div>
                    </div>
                    <div className='column small-6 padding-left'>
                        <div className='input-group' style={{marginBottom: 5, marginTop: '8px'}}>
                            <label>
                                <Field name='infinity' type='checkbox'
                                    onChange={(e) => this.onInfinityChange(e, values, setFieldValue)} />
                                {tt('create_nft_collection_jsx.infinity')}
                            </label>
                        </div>
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
                            {tt('create_nft_collection_jsx.create')}
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
        return { ...ownProps, currentUser, currentAccount, };
    },

    dispatch => ({
        createCollection: (
            name, json_metadata, max_token_count, currentUser, successCallback, errorCallback
        ) => {
            const username = currentUser.get('username')
            let json = JSON.parse(json_metadata)
            json = JSON.stringify(json)
            const operation = {
                creator: username,
                name,
                json_metadata: json,
                max_token_count: parseInt(max_token_count)
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_collection',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(CreateNFTCollection)
