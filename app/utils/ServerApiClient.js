const request_base = {
    method: 'POST',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

function isAvailable() {
    return !!process.env.BROWSER && !process.env.IS_APP && !window.$STM_ServerBusy
}

export function serverApiLogin(account) {
    if (!isAvailable()) return
    const request = Object.assign({}, request_base, {
        body: JSON.stringify({account, csrf: $STM_csrf}),
    });
    return fetch('/api/v1/login_account', request).then(r => r.json());
}

export function serverApiLogout() {
    if (!isAvailable()) return
    const request = Object.assign({}, request_base, {
        body: JSON.stringify({csrf: $STM_csrf}),
    });
    fetch('/api/v1/logout_account', request);
    localStorage.removeItem('invite')
}

let last_call;
export function serverApiRecordEvent(type, val) {
    if (!isAvailable()) return
    if (last_call && (new Date() - last_call < 5000)) return;
    last_call = new Date();
    const value = val && val.stack ? `${val.toString()} | ${val.stack}` : val;
    const request = Object.assign({}, request_base, {
        body: JSON.stringify({csrf: $STM_csrf, type, value})
    });
    fetch('/api/v1/record_event', request);
}

let last_page, last_views, last_page_promise;
export function recordPageView(page, ref, posts) {
    if (last_page_promise && page === last_page) return last_page_promise;
    if (window.ga) { // virtual pageview
        let guid = localStorage.getItem('guid');
        if (guid) {
            window.ga('set', 'userId', guid);
        }
        window.ga('set', 'page', page);
        window.ga('send', 'pageview');
    }
    if (!isAvailable()) return Promise.resolve(0)
    const request = Object.assign({}, request_base, {
        body: JSON.stringify({csrf: $STM_csrf, page, ref, posts}),
    });
    last_page_promise = fetch(`/api/v1/page_view`, request).then(r => r.json()).then(res => {
        last_views = res.views;
        return last_views;
    });
    last_page = page;
    return last_page_promise;
}
