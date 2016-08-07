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

module.exports = function (config, webpackHook) {
    const app = express();

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

    // handle static files, js, images, etc.
    app.use('/', express.static(path.join(__dirname, '../../public'), {index: false}));

    // initialize authentication system, including login and auth callback routes
    auth.initialize(app, config);

    // handle all other application routes
    routes(app);

    return app;
};
