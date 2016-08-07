/**
 * Created by jhelmuth on 7/10/16.
 */

const App = require('./app.js');
const config = require('../libs/config');
const port = (process.env.PORT || 8080);

var webPackHook = function(app) {};

console.log('server.js process.env.NODE_ENV: ', process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') {
    console.log('server.js setting up webPackHook()');
    webPackHook = function(app) {
        const webpack = require('webpack');
        const webpackDevMiddleware = require('webpack-dev-middleware');
        const webpackHotMiddleware = require('webpack-hot-middleware');
        const wp_config = require('../../webpack.dev.config.js');
        const compiler = webpack(wp_config);
        console.log('loading webpack hot middleware and dev middleware');
        app.use(webpackHotMiddleware(compiler));
        app.use(webpackDevMiddleware(compiler, {
            noInfo: true,
            publicPath: wp_config.output.publicPath
        }));
    };
}

const app = App(config, webPackHook);
app.listen(port);
console.log(`Listening at http://localhost:${port}`);
