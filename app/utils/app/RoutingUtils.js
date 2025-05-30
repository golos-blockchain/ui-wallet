import { browserHistory, } from 'react-router'

export function reloadLocation(href) {
    if (href && href[0] === '#') {
        throw new Error('reloadLocation cannot reload with href starts with #')
    }
    const { MOBILE_APP } = process.env
    if (MOBILE_APP) {
        let { pathname, hash, host } = window.location
        if (href) {
            if (href.startsWith('http:') || href.startsWith('https:')) {
                const url = new URL(href)
                if (url.host !== host) {
                    window.open(href, '_blank')
                    // And just opening in same tab - not working, somewhy opens with app's hostname...
                    return
                }
                href = url.pathname + url.search + url.hash
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
    if (href) {
        window.location.href = href
    } else {
        window.location.reload()
    }
}

export function hrefClick(e) {
    if (process.env.MOBILE_APP) {
        let node, href, target    
        do {
            node = node ? node.parentNode : e.target
            if (!node) break
            href = node.href
            target = node.target
        } while (!href)
        if (!href) return
        e.preventDefault()
        if (target === 'blank' || target === '_blank') {
            window.open(href, '_blank')
            return
        }
        reloadLocation(href)
    }
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

//... and this is temporary (not correct) fix of clicking back button 
//after such reloads.
//it protects from "navigation leakage" in this case, but makes "back" behaviour not exactly crrect
export function backRouteFix(e) {
    if (!process.env.MOBILE_APP) return
    let { referrer } = document // very bad idea
    if (referrer) {
        try {
            referrer = new URL(referrer).pathname
        } catch (err) {
            referrer = null
        }
        if (referrer && referrer !== '/') {
            reloadLocation('/')
            e.preventDefault()
            return
        }
    }
    window.history.back()
    // and it cannot detect "can't go back and should exit app"
}
