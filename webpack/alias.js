const path = require('path');

function resolvePath(...rest) {
    return path.join(__dirname, '..', 'app', ...rest);
}

module.exports = {
    process: 'process/browser',
    stream: 'stream-browserify',
    react: path.join(__dirname, '../node_modules', 'react'),
    app: path.join(__dirname, '..', 'app'),
    assets: resolvePath('assets'),
    db: path.join(__dirname, '..', 'db'),
    shared: path.join(__dirname, '..', 'shared'),
    'golos-ui': resolvePath('components', 'elements', 'golos-ui'),
    '@elements': resolvePath('components', 'elements'),
    '@modules': resolvePath('components', 'modules'),
    '@pages': resolvePath('components', 'pages'),
    '@utils': resolvePath('utils'),
};
