import { browserHistory, } from 'react-router'

export function reloadLocation(href) {
    if (href && href[0] === '#') {
        throw new Error('reloadLocation cannot reload with href starts with #')
    }
    const { MOBILE_APP } = process.env
    if (MOBILE_APP) {
        let { pathname, hash } = window.location
        if (href) {
            if (href.startsWith('http:') || href.startsWith('https:')) {
                window.open(href, '_blank')
                // And just opening in same tab - not working, somewhy opens with app's hostname...
                return
            }
            if (href[0] !== '/') {
                href = '/' + href
            }
        } else {
            href = pathname || '/'
        }
        window.location.href = '/#' + href
        if (!pathname || pathname === '/') {
            window.location.reload()
        }
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
