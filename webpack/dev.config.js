const path = require('path')

const webpack = require('webpack');
const { merge } = require('webpack-merge');
const git = require('git-rev-sync');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const baseConfig = require('./base.config');
const ExportAssetsPlugin = require('./plugins/ExportAssetsPlugin');
const StartServerPlugin = require('./plugins/StartServerPlugin');

const WEBPACK_PORT = process.env.PORT ? parseInt(process.env.PORT) + 1 : 8081;

module.exports = merge(baseConfig, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        publicPath: '/assets/',
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                BROWSER: JSON.stringify(true),
                NODE_ENV: JSON.stringify('development'),
                VERSION: JSON.stringify(git.long()),
            },
            global: {
                TYPED_ARRAY_SUPPORT: JSON.stringify(false),
            },
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new ExportAssetsPlugin({
            development: true
        }),
        new StartServerPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { sourceMap: true } },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [
                                require('autoprefixer')({
                                    browsers: ['> 1%', 'last 2 versions'],
                                }),
                            ],
                            sourceMap: true,
                        },
                    },
                    { loader: 'sass-loader', options: { sourceMap: true } },
                ],
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'assets'),
        },
        compress: true,
        port: WEBPACK_PORT,
        hot: true,
    },
});
