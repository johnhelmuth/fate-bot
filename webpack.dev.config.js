/**
 * Created by jhelmuth on 7/10/16.
 *
 * based on http://ditrospecta.com/javascript/react/es6/webpack/heroku/2015/08/08/deploying-react-webpack-heroku.html
 */

const path = require('path');
const webpack = require('webpack');

module.exports = {
    devtool: 'eval',

    entry: [
        'babel-polyfill',
        'webpack-hot-middleware/client',
        './src/webapp/index'
    ],

    output: {
        path: path.join(__dirname, 'doesnt_matter'),
        filename: 'bundle.js',
        publicPath: '/'
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],

    module: {
        loaders: [
            {
                test: /\.js?$/,
                loader: 'babel',
                exclude: /node_modules/
            },
            {
                test: /\.less?$/,
                loader: 'style!css!less',
                include: path.join(__dirname, 'src', 'webapp')
            },
            {
                test: /\.png$/,
                loader: 'file'
            },
            {
                test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
                loader: 'file'
            }
        ]
    }
};