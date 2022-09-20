const path = require('path');

function resolvePath(...rest) {
    return path.join(__dirname, '..', 'app', ...rest);
}

module.exports = {
    react: path.join(__dirname, '../node_modules', 'react'),
    src: path.join(__dirname, '..', 'src'),
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
