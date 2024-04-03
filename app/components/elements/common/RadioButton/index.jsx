import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import HintIcon from 'app/components/elements/common/HintIcon/HintIcon'
import radioOn from './radio-on.svg'
import radioOff from './radio-off.svg'

export default class RadioButton extends React.PureComponent {

    _onClick = e => {
        e.preventDefault()
        const { id, name, onChange } = this.props
        if (onChange) {
            onChange(id, name)
        }
    }

    render() {
        const { title, hint, id, name, disabled, selectedValue, className} = this.props
        return <div key={id} className={cn('RadioButton__item', { RadioButton_disabled: disabled }, className)}>
            <label
                className="RadioButton__label"
                onClick={
                    disabled
                        ? null
                        : this._onClick
                }
            >
                <input
                    type="radio"
                    name={name}
                    className="RadioButton__input"
                    disabled={disabled}
                    checked={id === selectedValue}
                />
                <i
                    className={cn(
                        'RadioButton__svg-wrapper',
                        {
                            'RadioButton__svg-wrapper_value':
                                id === selectedValue,
                        }
                    )}
                    dangerouslySetInnerHTML={{
                        __html:
                            id === selectedValue
                                ? radioOn
                                : radioOff,
                    }}
                />
                <span className="RadioButton__label-text">
                    {title}
                </span>
            </label>
            {hint ? (
                <span className="RadioButton__hint">
                    <HintIcon hint={hint} />
                </span>
            ) : null}
        </div>
    }
}
