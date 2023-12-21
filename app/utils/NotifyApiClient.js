const request_base = {
    method: 'post',
    credentials: 'include',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const notifyAvailable = () => {
    return process.env.BROWSER && typeof($STM_Config) !== 'undefined'
        && $STM_Config.notify_service && $STM_Config.notify_service.host;
};

const notifyWsAvailable = () => {
    return notifyAvailable() && $STM_Config.notify_service.host_ws
}

const notifyUrl = (pathname) => {
    return new URL(pathname, window.$STM_Config.notify_service.host).toString();
};

function setSession(request) {
    request.headers['X-Session'] = localStorage.getItem('X-Session');
}

export function notifySession() {
    return localStorage.getItem('X-Session')
}

function saveSession(response) {
    let session = null;
    for (const header of response.headers.entries()) { // Firefox Android not supports response.headers.get()
        if (header[0].toLowerCase() === 'x-session') {
            session = header[1];
            break;
        }
    }
    if (!session) return;
    localStorage.setItem('X-Session', session);
}

async function connectNotifyWs() {
    if (!window.notifyWs || window.notifyWs.readyState !== 1) {
        window.notifyWsReq = { id: 0, requests: {}, callbacks: {} }
        if (window.notifyWs) {
            window.notifyWs.close()
        }
        await new Promise((resolve, reject) => {
            const notifyWs = new WebSocket($STM_Config.notify_service.host_ws)
            window.notifyWs = notifyWs

           const timeout = setTimeout(() => {
                if (notifyWs && !notifyWs.isOpen) {
                    reject(new Error('Cannot connect Notify WS'))
                }
            }, 5000)

            notifyWs.addEventListener('open', () => {
                notifyWs.isOpen = true
                clearTimeout(timeout)
                resolve()
            })

            notifyWs.addEventListener('сlose', () => {
                if (!notifyWs.isOpen) {
                    clearTimeout(timeout)
                    const err = new Error('notifyWs - cannot connect')
                    reject(err)
                }
            })

            notifyWs.addEventListener('message', (msg) => {
                if (window._notifyDebug) {
                    console.log('notifyWs message:', msg)
                }
                const data = JSON.parse(msg.data)
                const id = data.id
                const request = window.notifyWsReq.requests[id]
                if (request) {
                    const cleanRequest = () => {
                        delete window.notifyWsReq.requests[id]
                    }

                    if (data.err) {
                        request.callback(new Error(data.err.code + ': ' + data.err.msg), data)
                        cleanRequest()
                        return
                    }
                    request.callback(null, data.data)
                    cleanRequest()
                } else if (!id && data.data && data.data.event) {
                    const { event } = data.data
                    const callback = window.notifyWsReq.callbacks[event]
                    if (callback) {
                        callback.callback(null, data.data)
                    }
                }
            })
        })
    }
}

async function notifyWsSend(api, args, callback = null, eventCallback = null) {
    try {
        await connectNotifyWs()
        const id = window.notifyWsReq.id++
        let msg = {
            api,
            args,
            id
        }
        msg = JSON.stringify(msg)
        if (callback) {
            window.notifyWsReq.requests[id] = { callback }
        }
        if (eventCallback) {
            const { event, callback } = eventCallback
            window.notifyWsReq.callbacks[event] = { callback }
        }
        window.notifyWs.send(msg)
    } catch (err) {
        if (callback) {
            callback(err, null)
        }
    }
}

export function notifyApiLogin(account, authSession) {
    if (!notifyAvailable()) return;
    let request = Object.assign({}, request_base, {
        body: JSON.stringify({account, authSession}),
    });
    setSession(request);
    return fetch(notifyUrl(`/login_account`), request).then(r => {
        saveSession(r);
        return r.json();
    });
}

export function notifyApiLogout() {
    if (!notifyAvailable()) return;
    let request = Object.assign({}, request_base, {
        method: 'get',
    });
    setSession(request);
    fetch(notifyUrl(`/logout_account`), request).then(r => {
        saveSession(r);
    });
}

export function getNotifications(account) {
    if (!notifyAvailable()) return Promise.resolve(null);
    let request = Object.assign({}, request_base, {method: 'get'});
    setSession(request);
    return fetch(notifyUrl(`/counters/@${account}`), request).then(r => {
        saveSession(r);
        return r.json();
    }).then(res => {
        return res.counters;
    });
}

export async function getNotificationsWs(account) {
    if (!notifyWsAvailable()) {
        console.error('getNotificationsWs - no notify_service.host_ws in config?')
        return null
    }
    return await new Promise(async (resolve, reject) => {
        await notifyWsSend('counters', {
            account
        }, (err, res) => {
            if (err) {
                reject(err)
                return
            }
            resolve(res.counters)
        })
    })
}

export function markNotificationRead(account, fields) {
    if (!notifyAvailable()) return Promise.resolve(null);
    let request = Object.assign({}, request_base, {method: 'put', mode: 'cors'});
    setSession(request);
    const fields_str = fields.join(',');
    return fetch(notifyUrl(`/counters/@${account}/${fields_str}`), request).then(r => {
        saveSession(r);
        return r.json();
    }).then(res => {
        return res.counters;
    });
}

export async function markNotificationReadWs(account, fields) {
    if (!notifyWsAvailable()) return null
    const xSession = notifySession()
    const scopes = fields.join(',')
    return await new Promise(async (resolve, reject) => {
        await notifyWsSend('counters/read', {
            account,
            'X-Session': xSession,
            scopes,
        }, (err, res) => {
            if (err) {
                reject(err)
                return
            }
            resolve(res.counters)
        })
    })
}

export async function counterSubscribeWs(account, callback) {
    if (!notifyWsAvailable()) return null
    const xSession = notifySession()
    return await new Promise(async (resolve, reject) => {
        await notifyWsSend('counters/subscribe', {
            account,
            'X-Session': xSession,
        }, (err, res) => {
            if (err) {
                reject(err)
                return
            }
            resolve(res)
        }, { event: 'counter', callback})
    })
}

export async function counterUnsubscribeWs(account) {
    if (!notifyWsAvailable()) return null
    const xSession = notifySession()
    return await new Promise(async (resolve, reject) => {
        await notifyWsSend('counters/unsubscribe', {
            account,
            'X-Session': xSession,
        }, (err, res) => {
            if (err) {
                reject(err)
                return
            }
            resolve(res)
        })
    })
}

export async function notificationSubscribe(account, scopes = 'message', sidKey = '__subscriber_id') {
    if (!notifyAvailable()) return;
    if (window[sidKey]) return;
    try {
        let request = Object.assign({}, request_base, {method: 'get'});
        setSession(request);
        let response = await fetch(notifyUrl(`/subscribe/@${account}/${scopes}`), request);
        const result = await response.json();
        if (response.ok) {
            saveSession(response);
        }
        if (result.subscriber_id) {
            window[sidKey] = result.subscriber_id;
            return result.subscriber_id;
        } else {
            throw new Error('Cannot subscribe, error: ' + result.error);
        }
    } catch (ex) {
        console.error(ex)
    }
    throw new Error('Cannot subscribe');
}

export async function notificationUnsubscribe(account, sidKey = '__subscriber_id') {
    if (!notifyAvailable()) return;
    if (!window[sidKey]) return;
    let url = notifyUrl(`/unsubscribe/@${account}/${window[sidKey]}`);
    let response;
    try {
        let request = Object.assign({}, request_base, {method: 'get'});
        setSession(request);
        response = await fetch(url, request);
        if (response.ok) {
            saveSession(response);
        }
        const result = await response.json();
        if (result.status !== 'ok') {
            throw new Error(response.status + ': ' + result.error);
        } else {
            window[sidKey] = null;
            return result.was;
        }
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
}

export async function notificationTake(account, removeTaskIds, forEach, sidKey = '__subscriber_id') {
    if (!notifyAvailable()) return;
    let url = notifyUrl(`/take/@${account}/${window[sidKey]}`);
    if (removeTaskIds)
        url += '/' + removeTaskIds;
    let response;
    try {
        let request = Object.assign({}, request_base, {method: 'get'});
        setSession(request);
        response = await fetch(url, request);
        if (response.ok) {
            saveSession(response);
        }
        const result = await response.json();
        if (result.status === 'ok' && Array.isArray(result.tasks)) {
            removeTaskIds = '';

            let removeTaskIdsArr = [];
            for (let task of result.tasks) {
                const [ type, op ] = task.data;

                forEach(type, op, task.timestamp, task.id, task.scope);

                removeTaskIdsArr.push(task.id.toString());
            }

            removeTaskIds = removeTaskIdsArr.join(',');

            return removeTaskIds;
        } else {
            throw new Error(response.status + ': ' + result.error);
        }
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
}

if (process.env.BROWSER) {
    window.getNotifications = getNotifications;
    window.getNotificationsWs = getNotificationsWs
    window.markNotificationRead = markNotificationRead;
    window.markNotificationReadWs = markNotificationReadWs
    window.counterSubscribeWs = counterSubscribeWs
    window.counterUnsubscribeWs = counterUnsubscribeWs
    window.notificationSubscribe = notificationSubscribe;
    window.notificationUnsubscribe = notificationUnsubscribe;
    window.notificationTake = notificationTake;
}
