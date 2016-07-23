/**
 * Created by jhelmuth on 7/16/16.
 */

var auth = require("../auth");
var _ = require('lodash');
var Promise = require('bluebird');
var Charsheet = require('../../libs/charsheet');
var express = require('express');
var path = require('path');
var Diceroller = require('../../libs/diceroller');
var api_routes = require('./api');

function fatebot(req) {
    if (req.app.locals.fatebot) {
        return req.app.locals.fatebot;
    }
    return null;
}

module.exports = function(app, checkAuth) {
    const indexPath = path.join(__dirname, '../../../public/index.html');
    api_routes(app, fatebot);
    app.get('*', checkAuth,
        function (req, res) {
            console.log('/ serving index.html');// dump the user for debugging
            if (req.isAuthenticated()) {
                console.log('/ user: ', req.user);
            }
            res.sendFile(indexPath);
        });
};
