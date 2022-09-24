var React = require('react')
var ReactDOMServer = require('react-dom/server');
const fs = require('fs')
const fse = require('fs-extra')
import ServerHTML from './server/server-html';

const assets_filename = process.env.NODE_ENV === 'production' ? './tmp/assets.json' : './tmp/assets-dev.json'
const assets = require(assets_filename)

let destDir
const argv = process.argv
if (argv.length !== 3) {
    console.log('Usage is: babel-node build_app_entry.js /path/to/build/dest')
    process.exit(-1)
}
destDir = argv[2]

const props = { body: '', assets, title: '', relativeSrc: false };

let html = ReactDOMServer.renderToString(<ServerHTML {...props} />)
html = '<!DOCTYPE html>' + html
fs.writeFileSync(destDir + '/index.html', html)
fse.copySync('app/locales', destDir + '/locales', { overwrite: true })
fse.copySync('app/assets/images', destDir + '/images', { overwrite: true }) // for some direct links
