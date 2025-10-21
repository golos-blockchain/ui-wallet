const webpack = require('webpack');
const { merge } = require('webpack-merge');
const baseConfig = require('./base.config');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ExportAssetsPlugin = require('./plugins/ExportAssetsPlugin');
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(baseConfig, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                BROWSER: JSON.stringify(true),
                NODE_ENV: JSON.stringify('production'),
            },
            global: {
                TYPED_ARRAY_SUPPORT: JSON.stringify(false),
            },
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[chunkhash].css',
            chunkFilename: '[id].[chunkhash].css',
        }),
        new ExportAssetsPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require('autoprefixer')({
                                        overrideBrowserslist: ['> 1%', 'last 2 versions'],
                                    })
                                ]
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                quietDeps: true,
                                silenceDeprecations: ['legacy-js-api', 'import'],
                            }
                        }
                    },
                ],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin(),
        ],
    },
    ignoreWarnings: [
        (warning) => {
            return warning.message?.includes('.scss')
        }
    ],
});
