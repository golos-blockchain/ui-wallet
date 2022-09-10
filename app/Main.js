import renderApp from 'app/renderApp'

if (!window.Intl) {
    require.ensure(
        ['intl/dist/Intl'],
        (require) => {
            window.IntlPolyfill = window.Intl = require('intl/dist/Intl')
            require('intl/locale-data/jsonp/en-US.js')
            renderApp(window.$glsIniState)
        },
        'IntlBundle'
    )
} else {
    renderApp(window.$glsIniState)
}
