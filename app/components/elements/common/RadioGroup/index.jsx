import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import RadioButton from 'app/components/elements/common/RadioButton'

export default class RadioGroup extends React.PureComponent {
    static propTypes = {
        options: PropTypes.array.isRequired,
        disabled: PropTypes.bool,
        className: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
            .isRequired,
        onChange: PropTypes.func.isRequired,
    };

    render() {
        const { title, options, name, value, className, disabled, onChange } = this.props;

        return <div title={title} className={cn('RadioGroup', { }, className)}>
                {options.map(item => 
                    <RadioButton id={item.id} title={item.title} hint={item.hint}
                        name={name} disabled={disabled} selectedValue={value}
                        onChange={onChange} />
                )}
            </div>;
    }
}

function noop() {}
