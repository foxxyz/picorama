const path = require('path')
const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = (env = {}) => {
    let config = {
        mode: env.PRODUCTION ? 'production' : 'development',
        entry: {
            'main': './src/index.js',
        },
        output: {
            path: path.join(__dirname, 'public'),
            filename: '[name].js'
        },
        resolve: {
            modules: [path.join(__dirname, 'src'), "node_modules"]
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.sass$/,
                    use: [
                        'vue-style-loader',
                        'css-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                indentedSyntax: true
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/
                },
                {
                    test: /(\.html|favicon)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]'
                    }
                },
                {
                    test: /\.(png|jpg|gif|svg|ttf|woff2|woff)$/,
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        name: '[name].[ext]?[hash]'
                    }
                }
            ]
        },
        devServer: {
            historyApiFallback: true,
            noInfo: true,
            contentBase: path.join('.', 'src'),
        },
        devtool: 'cheap-module-eval-source-map',
        plugins: [
            new webpack.DefinePlugin({PRODUCTION: JSON.stringify(env.production)}),
            new VueLoaderPlugin()
        ]
    }

    // Production configuration
    if (env.production) {
        config.devtool = 'cheap-module-source-map'
    }

    return config
}
