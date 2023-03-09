import React from 'react';
import { toast } from 'react-hot-toast'
import { Link } from 'react-router'
import tt from 'counterpart';
import { Asset } from 'golos-lib-js/lib/utils';

import Icon from 'app/components/elements/Icon';
import Userpic from 'app/components/elements/Userpic';
import iconCross from 'app/assets/icons/cross.svg';
import { blogsUrl, blogsTarget } from 'app/utils/blogsUtils'
import { msgsLink } from 'app/utils/ExtLinkUtils'

const actionStyle = {
    // fixme
    paddingTop: '2px',
    // paddingLeft: '11px',
    // paddingRight: '0px',
    display: 'flex',
    height: '100%',
    alignItems: 'center',
};

const cross = () => {
    return (<span className='NotificationContent__action'
        dangerouslySetInnerHTML={{ __html: iconCross }} />);
};

const onClick = (e, t) => {
    toast.dismiss(t.id)
}

const transfer = (t, scope, type, op) => {
    const { from, to, amount, } = op;
    const isSend = scope === 'send';

    let icon = null;
    let message = null;
    let url = null;
    if (scope === 'donate' || scope === 'donate_msgs') {
        icon = 'notification/donate';
        message = tt('notify_content.donate_AMOUNT', { AMOUNT: amount, });
        url = `/@${to}/donates-to`;
    } else {
        icon = 'notification/transfer';
        if (isSend) {
            message = tt('notify_content.send_AMOUNT', { AMOUNT: amount, }) + ' ' + to;
        } else {
            message = tt('notify_content.receive_AMOUNT', { AMOUNT: amount, });
        }
        url = `/@${to}/transfers`;
    }

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <Link to={url} onClick={e => onClick(e, t)}>
                    <span className='NotificationContent__action_source'>
                        {isSend ? null : from}
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}
                        </span>
                    </span>
                </Link>
            </div>
        </div>
    );
};

const comment = (t, scope, type, op) => {
    const { author, permlink, parent_author, parent_permlink, _depth, mentioned, } = op;

    let icon = null;
    let message = null;
    let url = null;
    if (scope === 'comment_reply') {
        icon = 'notification/comment';
        if (_depth > 1) {
            message = tt('notify_content.reply_comment');
        } else {
            message = tt('notify_content.reply_post');
        }
        url = blogsUrl(`/@${parent_author}/recent-replies`)
    } else if (scope === 'mention') {
        icon = 'notification/mention';
        if (parent_author) {
            message = tt('notify_content.mention_comment');
        } else {
            message = tt('notify_content.mention_post');
        }
        url = blogsUrl(`/@${mentioned}/mentions`)
    } else {
        return null;
    }

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <a href={url} target={blogsTarget()}>
                    <span className='NotificationContent__action_source'>
                        {author}
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}.
                        </span>
                    </span>
                </a>
            </div>
        </div>
    );
};

const message = (t, scope, type, op) => {
    const { from, to } = op;

    let icon = 'notification/message';
    let message = tt('notify_content.message');
    let url = msgsLink(from)

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <a href={url} target='_blank' rel='noopener noreferrer'>
                    <span className='NotificationContent__action_source'>
                        {from}
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}.
                        </span>
                    </span>
                </a>
            </div>
        </div>
    );
};

const fillOrder = (t, scope, type, op) => {
    const { current_pays, open_pays, } = op;

    const sym1 = Asset(current_pays).symbol;
    const sym2 = Asset(open_pays).symbol;

    let icon = 'notification/order';
    let message = tt('notify_content.fill_order_AMOUNT_AMOUNT2',
        {
            AMOUNT: current_pays,
            AMOUNT2: open_pays,
        });
    let url = `/market/${sym1}/${sym2}`;

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <a href={url} target='_blank'>
                    <span className='NotificationContent__action_source'>
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}.
                        </span>
                    </span>
                </a>
            </div>
        </div>
    );
};

export default function render(t, action) {
    const { scope, type, op } = action;
    try {
        return (
            type === 'transfer' ? transfer(t, scope, type, op) :
            (type === 'donate' || type === 'donate_msgs') ? transfer(t, scope, type, op) :
            (type === 'comment' || type === 'comment_reply' || type === 'comment_mention') ? comment(t, scope, type, op) :
            type === 'private_message' ? message(t, scope, type, op) :
            type === 'fill_order' ? fillOrder(t, scope, type, op) :
            null
        );
    } catch (err) {
        console.error('NotifyContent', err);
        throw err;
    }
}
