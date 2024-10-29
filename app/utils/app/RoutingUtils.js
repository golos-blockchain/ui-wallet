export function reloadLocation(href) {
    const { MOBILE_APP } = process.env
    if (MOBILE_APP) {
        if (href) {
            if (href[0] !== '/') {
                href = '/' + href
            }
        } else {
            let { pathname, hash } = window.location
            if ((!pathname || pathname === '/') && hash && hash[1] === '/') {
                window.location.reload()
                return
            }
            href = pathname || '/'
        }
        window.location.href = '/#' + href
        return
    }
    window.location.href = href
}

//... and this processes such reloads:

export function fixRouteIfApp() {
    const { MOBILE_APP } = process.env
    if (!MOBILE_APP) {
        return true
    }
    let hash = window.location.hash
    if (hash && hash[1] === '/') {
        hash = hash.slice(1)
        if (!hash) hash = '/'
        browserHistory.push(hash)
        return false
    }
    return true
}
