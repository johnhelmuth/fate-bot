/**
 * Created by jhelmuth on 7/10/16.
 */

const path = require('path');
const express = require('express');
const routes = require('./routes');
const session = require('express-session');
const passport = require('passport');
const auth = require('./auth');
const MongoStore = require('connect-mongo')(session);
const compression = require('compression');
const morgan = require('morgan');

module.exports = {
    app: function (config, webpackHook, fatebot) {
        const app = express();

        app.locals.fatebot = fatebot;

        app.use(compression());

        webpackHook(app);

        app.use(morgan('combined'));

        app.use(session({
            secret: 'lajsdfla doina vhasduf ',
            store: new MongoStore({url: config('mongo').url}),
            resave: false,
            saveUninitialized: false
        }));

        app.use(function(req, res, done) {
            console.log('req.session: ', req.session);
            done();
        });

        app.use('/', express.static(path.join(__dirname, '../../public'), {index: false}));

        auth.initialize(app, config);

        var checkAuth = auth.checkAuth.bind(auth, fatebot);

        routes(app, checkAuth);

        return app;
    }
};
