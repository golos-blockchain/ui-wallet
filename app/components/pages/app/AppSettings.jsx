import React from 'react'
import tt from 'counterpart'
import { Formik, Field } from 'formik'

import Icon from 'app/components/elements/Icon'

class AppSettings extends React.Component {
    _onSubmit = (data) => {
        let cfg = { ...$STM_Config }
        if (data.custom_address) {
            const exists = cfg.ws_connection_app.find(item => item.address === data.custom_address)
            if (!exists) {
                cfg.ws_connection_app.push({
                    address: data.custom_address
                })
            }
        }
        if (data.ws_connection_client === 'custom') {
            cfg.ws_connection_client = data.custom_address
        } else {
            cfg.ws_connection_client = data.ws_connection_client
        }
        cfg.images.img_proxy_prefix = data.img_proxy_prefix
        cfg.images.use_img_proxy = data.use_img_proxy
        cfg.auth_service.host = data.auth_service
        cfg.notify_service.host = data.notify_service
        cfg.notify_service.host_ws = data.notify_service_ws
        if (process.env.MOBILE_APP) {
            cfg = JSON.stringify(cfg)
            localStorage.setItem('app_settings', cfg)
            window.location.href = '/'
            return
        }
        window.appSettings.save(cfg)
    }

    _onClose = (e) => {
        e.preventDefault()
        if (process.env.MOBILE_APP) {
            window.location.href = '/'
            return
        }
        window.close()
    }

    makeInitialValues() {
        let initialValues = {
            ws_connection_client: $STM_Config.ws_connection_client,
            img_proxy_prefix: $STM_Config.images.img_proxy_prefix,
            use_img_proxy: $STM_Config.images.use_img_proxy,
            auth_service: $STM_Config.auth_service.host,
            notify_service: $STM_Config.notify_service.host,
            notify_service_ws: $STM_Config.notify_service.host_ws || '',
        }
        this.initialValues = initialValues
    }

    constructor(props) {
        super(props)
        this.makeInitialValues()
    }

    showLogs = (e) => {
        e.preventDefault()
        NativeLogs.getLog(
            200,
            false,
            logs => {
                alert(logs)
            }
        )
    }

    _renderNodes(ws_connection_client) {
        let fields = []
        for (let i in $STM_Config.ws_connection_app) {
            let pair = $STM_Config.ws_connection_app[i]
            let { address, } = pair
            fields.push(
                <div style={{ display: 'block' }}>
                    <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                        <Field name='ws_connection_client'
                            type='radio'
                            value={address}
                        />
                        {address}
                    </label>
                </div>
            )
        }
        fields.push(
            <div style={{ display: 'block' }}>
                <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                    <Field name='ws_connection_client'
                        type='radio'
                        value={'custom'}
                    />
                    <Field name='custom_address'
                        type='text'
                        autoComplete='off'
                        style={{ width: '300px', display: 'inline-block' }}
                    />
                </label>
            </div>
        )
        return fields
    }

    render() {
        const { MOBILE_APP } = process.env
        return <div>
            <h1 style={{marginLeft: '0.5rem', marginTop: '1rem'}}>
                {MOBILE_APP ? <a href='/' style={{ marginRight: '0.5rem' }} onClick={this._onClose}>
                    <Icon name='chevron-left' />
                </a> : null}
                {MOBILE_APP ? tt('app_settings.mobile_title') : tt('g.settings')}
            </h1>
            <div className='secondary' style={{ paddingLeft: '0.625rem', marginBottom: '0.25rem' }}>
                {tt('app_settings.to_save_click_button')}
            </div>
            <Formik
                initialValues={this.initialValues}
                onSubmit={this._onSubmit}
            >
                {({
                    handleSubmit, isSubmitting, errors, values, handleChange,
                }) => (
                <form
                    onSubmit={handleSubmit}
                    autoComplete='off'
                >
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.ws_connection_client')}
                            <div style={{marginBottom: '1.25rem'}}>
                                {this._renderNodes(values.ws_connection_client)}
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                                <Field
                                    name={`use_img_proxy`}
                                    type='checkbox'
                                    className='input-group-field bold'
                                />
                                {tt('app_settings.img_proxy_prefix')}
                            </label>
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='img_proxy_prefix'
                                    disabled={!values.use_img_proxy}
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.auth_service')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='auth_service'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.notify_service')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='notify_service'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.notify_service_ws')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='notify_service_ws'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    {MOBILE_APP ? null : <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.elastic_search')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='elastic_search'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>}
                    <div className='row' style={{marginTop: 15}}>
                        <div className='small-12 columns'>
                            <div>
                                <button type='submit' className='button'>
                                    {MOBILE_APP ? tt('g.save') : tt('app_settings.save_and_restart')}
                                </button>
                                {MOBILE_APP ? null :<button type='button' className={'button hollow ' + (MOBILE_APP ? '' : 'float-right')} onClick={this._onClose}>
                                    {tt('app_settings.cancel')}
                                </button>}
                                {MOBILE_APP ? <a href='#' className='float-right' onClick={this.showLogs}>
                                    {tt('app_settings.logs')}
                                </a> : null}
                            </div>
                        </div>
                    </div>
                </form>
            )}</Formik>
        </div>
    }
}

module.exports = {
    path: '/__app_settings',
    component: AppSettings,
}

module.exports.openAppSettings = function() {
    if (!process.env.MOBILE_APP) {
        window.location.href = '/__app_settings'
        return
    }
    const { pathname } = window.location
    window.location.href = '/#app-settings'
    if (pathname === '/' && window.appMounted) {
        window.location.reload() 
    }
}
