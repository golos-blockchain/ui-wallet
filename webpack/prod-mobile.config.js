const webpack = require('webpack');
const { mergeWithCustomize, unique } = require('webpack-merge');
const path = require('path');
let prodConfig = require('./prod.config');
const TerserPlugin = require('terser-webpack-plugin')

delete prodConfig.entry
delete prodConfig.optimization.minimizer

const prodMobileConfig = mergeWithCustomize({
    customizeArray: unique(
        'plugins',
        ['DefinePlugin'],
        (plugin) => plugin.constructor && plugin.constructor.name,
    ),
})(prodConfig, {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                BROWSER: JSON.stringify(true),
                NODE_ENV: JSON.stringify('production'),
                IS_APP: JSON.stringify(true),
                MOBILE_APP: JSON.stringify(true),
            },
            global: {
                TYPED_ARRAY_SUPPORT: JSON.stringify(false),
            },
        }),
    ],
    entry: {
        app: [ './app/MainApp.js' ],
        // vendor: ['react', 'react-dom', 'react-router']
    },
    output: {
        path: path.resolve(__dirname, '../dist/assets'),
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin(),
        ],
    },
});

module.exports = prodMobileConfig
