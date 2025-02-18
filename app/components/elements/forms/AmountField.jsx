import React from 'react'
import { Field, ErrorMessage, } from 'formik'

class AmountField extends React.Component {
    static defaultProps = {
        name: 'amount',
    }

    _renderInput = ({ field, form }) => {
        // TODO: is it right to pass all props to input
        const { placeholder, name, ...rest } = this.props
        const { value, } = field
        const { values, } = form
        return <input type='text' value={value.amountStr} placeholder={placeholder}
            {...rest} onChange={(e) => this.onChange(e, values, form)} />
    }

    onChange = (e, values, form) => {
        const { name } = this.props
        const newAmount = values[name].withChange(e.target.value)
        if (newAmount.hasChange && newAmount.asset.amount >= 0) {
            const { setFieldTouched, applyFieldValue } = form
            applyFieldValue(name, newAmount)
            if (this.props.onChange) {
                this.props.onChange(newAmount.asset, form)
            }
        }
    }

    render() {
        const { placeholder, name, ...rest } = this.props
        return (<Field name={name} type='text'
            placeholder={placeholder}
            autoComplete='off' autoCorrect='off' spellCheck='false' {...rest}>
                {this._renderInput}
            </Field>)
    }
}

export default AmountField
