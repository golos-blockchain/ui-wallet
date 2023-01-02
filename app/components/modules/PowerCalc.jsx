import React from 'react'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'
import { connect } from 'react-redux'
import golos from 'golos-lib-js'
import { Asset } from 'golos-lib-js/lib/utils'
import { Map } from 'immutable'

import DropdownMenu from 'app/components/elements/DropdownMenu'
import user from 'app/redux/User'
import { steemToVests, vestsToSteem, accuEmissionPerDay, vsEmissionPerDay } from 'app/utils/StateFunctions'
import { apidexGetPrices } from 'app/utils/ApidexApiClient'
import { getGameLevel } from 'app/utils/GameUtils'

class PowerCalc extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            amount: '',
            nextLevels: [],
            nearestLevel: null 
        }
    }

    initLevels = () => {
        const { currentAccount, gprops } = this.props
        if (!currentAccount || !gprops) {
            return
        }
        const gl = getGameLevel(currentAccount, gprops)
        let amount = vestsToSteem(currentAccount.get('vesting_shares'), gprops.toJS())
        amount = parseFloat(amount) / 4
        if (amount < 1) amount = 100
        this.setState({
            amount: Math.ceil(amount).toString(),
            nextLevels: gl.nextLevels || [],
            nearestLevel: (gl.nextLevels && gl.nextLevels[0]) || null
        })
    }

    async componentDidMount() {
        const pr = await apidexGetPrices('GOLOS')
        this.setState({
            rub_per_golos: pr.price_rub
        })
        this.initLevels()
    }

    componentDidUpdate() {
        if (!this.state.nextLevels) {
            this.initLevels()
        }
    }

    onChange = (e) => {
        this.setState({
            amount: e.target.value
        })
    }

    render() {
        const { gprops, currentAccount } = this.props
        const { amount, rub_per_golos, nextLevels, nearestLevel } = this.state

        if (!currentAccount) {
            return null
        }

        const am = parseFloat(amount)
        let addFloat = 0
        if (!isNaN(am) && am > 0) {
            const vests = steemToVests(am, gprops.toJS())
            addFloat = parseFloat(vests)
        }
        let willAchieve = accuEmissionPerDay(currentAccount, gprops, addFloat)

        let increaseRub, willAchieveRub
        if (rub_per_golos) {
            increaseRub = '~' + (am * rub_per_golos).toFixed(2) + ' RUB'
            willAchieveRub = '(~' + (willAchieve * rub_per_golos).toFixed(2) + ' RUB)'
        }

        willAchieve = Asset(willAchieve * 1000, 3, 'GOLOS')

        let apr = vsEmissionPerDay(gprops, 0, addFloat)
        apr *= 365
        const aprAmount = Asset(apr * 1000, 3, 'GOLOS')
        apr = Math.max(apr / (am || 0.01) * 100, 0.01).toFixed(2)

        let counter = 0
        const levels = this.state.nextLevels.map(level => {
            const imgSize = '24px'
            return {
                key: level.title[1],
                value: level.title[1],
                label: <span>
                        <img src={level.imageUrl} style={{ width: imgSize, height: imgSize }} />
                        <span style={{ marginLeft: '0.5rem' }}>{level.title[0]}</span>
                    </span>,
                link: '#',
                onClick: (e) => {
                    e.preventDefault(0)
                    this.setState({
                        nearestLevel: level
                    })
                }
            }
        })

        return <div>
            <div className="row">
                <div className='column small-12'>
                    <h4>{tt('power_calc_jsx.title')}</h4>
                </div>
            </div>
            <div className="row">
                <div className='column small-12'>
                    {tt('power_calc_jsx.if_increase_gp_for')}
                </div>
                <div className='column small-9'>
                    <div className="input-group" style={{marginBottom: 5}}>
                        <input type="text"
                            autoComplete="on" autoCorrect="off" autoCapitalize="off"
                            spellCheck="false"
                            autoFocus
                            value={this.state.amount} onChange={this.onChange} />
                        <span className="input-group-label">
                            GOLOS
                        </span>
                    </div>
                </div>
                {increaseRub ?<div className='column small-3' style={{ paddingTop: '0.3rem', paddingLeft: '0rem' }}>
                        {increaseRub}
                </div> : null}
            </div>
            <div className="row">
                <div className='column small-12'>
                    {tt('power_calc_jsx.you_will_achieve')}
                    <b>{' ' +willAchieve.floatString + ' ' + willAchieveRub + ' '}</b>
                    {tt('power_calc_jsx.daily')}.<br/>
                    <span style={{ fontSize: '80%' }}>
                        {tt('power_calc_jsx.apr') + ' ~' + aprAmount.toString() + ' (APR ' + apr + '%)'}
                    </span>
                </div>
            </div>
            {nearestLevel ? <hr/> : null}
            {nearestLevel ? <div className="row">
                <div className='column small-12'>
                    {tt('power_calc_jsx.to_achieve_level')}
                </div>
                <div className='column small-12'>
                    <DropdownMenu
                        el='div'
                        items={levels}
                        className='PowerCalc__levels'>
                        <img src={nearestLevel.imageUrl} style={{ width: '48px', height: '48px' }} />
                        <span style={{ marginLeft: '0.5rem' }}>{nearestLevel.title[0]}</span>
                    </DropdownMenu>
                </div>
                <div className='column small-12' style={{ marginTop: '3rem' }}>
                    {tt('power_calc_jsx.not_enough')}
                    <b>{' ~' + nearestLevel.golos_power_diff.toFixed(3) + ' GOLOS'}</b>
                </div>
            </div> : null}
        </div>
    }
}

export default connect(
    (state, props) => {
        const initialValues = state.user.get('power_calc_defaults', Map()).toJS()
        const { account } = initialValues
        const currentAccount = account && state.global.getIn(['accounts', account])
        const gprops = state.global.get('props')
        return {
            ...props,
            gprops,
            currentAccount,
        };
    },
    dispatch => ({
    })
)(PowerCalc)