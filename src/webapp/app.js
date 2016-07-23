/**
 * Created by jhelmuth on 7/10/16.
 */

const Server = require('./server.js');
const port = (process.env.PORT || 8080);

function startApp(app_config, fatebot) {

    var webPackHook = function(app) {};

    if (process.env.NODE_ENV !== 'production') {
        webPackHook = function(app) {
            const webpack = require('webpack');
            const webpackDevMiddleware = require('webpack-dev-middleware');
            const webpackHotMiddleware = require('webpack-hot-middleware');
            const config = require('../../webpack.dev.config.js');
            const compiler = webpack(config);
            console.log('loading webpack hot middleware and dev middleware');
            app.use(webpackHotMiddleware(compiler));
            app.use(webpackDevMiddleware(compiler, {
                noInfo: true,
                publicPath: config.output.publicPath
            }));
        };
    }
    console.log('NODE_ENV: ', process.env.NODE_ENV);

    const app = Server.app(app_config, webPackHook, fatebot);
    app.listen(port);
    console.log(`Listening at http://localhost:${port}`);
    return app;
}

module.exports = startApp;

