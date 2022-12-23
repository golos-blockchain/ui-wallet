import React from 'react';
import Tooltip from 'react-tooltip-lite'

export default ({children, className, t}) => {
    // eventToggle='onClick'
    return <Tooltip content={t} arrow={false} className={className} tagName='span'>
        {children}
    </Tooltip>
}
