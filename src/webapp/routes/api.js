/**
 * Created by jhelmuth on 7/24/16.
 */

var _ = require('lodash');
var express = require('express');
var Promise = require('bluebird');
const bi = require('../bot_interface');

var Charsheet = require('../../libs/charsheet');
// var Diceroller = require('../../libs/diceroller');

module.exports = function (app) {
    var router = express.Router();
    router.use(checkAPIAuth);
    router.get('/servers',
        function (req, res) {
            console.log('/servers called. req.user: ', req.user);
            bi.getServers()
                .then(function (servers) {
                    console.log('/servers servers: ', servers);
                    servers =
                        _.intersectionBy(servers, req.user.guilds, ((server) => server.id))
                            .map((server) => {
                                return {id: server.id, icon: server.icon, name: server.name};
                            });
                    Promise.all(servers.map((server) => {
                            return Charsheet.loadBy({server_id: server.id})
                                .then(function (charsheets) {
                                    server.characters = charsheets;
                                    return server;
                                });
                        })
                    ).then(function (servers) {
                        console.log('returning servers: ', servers);
                        res.json({servers: servers});
                    });
                })
                .catch(function (err) {
                    console.error('Error asking fatebot for servers: ', err);
                    res.json({servers: []});
                });
        });

    router.get('/server/:server_id',
        checkUserHasServer,
        function (req, res) {
            console.log('/api/servers/:server_id/characters called. server_id: ', req.params.server_id);
            bi.getServer(req.params.server_id)
                .then(function (server) {
                    Charsheet.loadBy({server_id: req.params.server_id})
                        .then(function (charsheets) {
                            res.json({
                                id: server.id,
                                icon: server.icon,
                                name: server.name,
                                characters: charsheets
                            });
                        })
                        .catch(function (err) {
                            res.status(500).json({message: "Error: " + err});
                        });
                })
                .catch(function (err) {
                    console.error('Error asking fatebot for servers: ', err);
                    res.status(404).json({message: "Not found."});
                });
        }
    );

    router.get('/server/:server_id/character/:player_id',
        checkUserHasServer,
        function (req, res) {
            console.log('/api/servers/:server_id/characters called. server_id: ', req.params.server_id);
            bi.getServer(req.params.server_id)
                .then(function (server) {
                    Charsheet.loadBy({server_id: req.params.server_id, player_id: req.params.player_id})
                        .then(function (charsheets) {
                            var charsheet = charsheets[0];
                            charsheet.server_name = server.name;
                            charsheet.server_icon = server.icon;
                            charsheet.is_owner = userOwnsCharacter(req.user, charsheet.player_id);
                            res.json(charsheet);
                        })
                        .catch(function (err) {
                            res.status(500).json({message: "Error: " + err});
                        });
                })
                .catch(function (err) {
                    console.error('Error asking fatebot for servers: ', err);
                    res.status(404).json({message: "Not found."});
                });
        }
    );

    router.get('/server/:server_id/character/:player_id/:skill/roll/:description?',
        checkUserHasServer,
        checkUserOwnsCharacter,
        function (req, res) {
            console.log('/servers/:server_id/character/:player_id/:skill/roll called. req.params: ', req.params);
            bi.rollSkill(req.params.server_id, req.params.player_id, req.params.skill, req.params.description)
                .then(function(result) {
                    console.log('callback from bi.rollSkill() result: ', result);
                    res.json(result);
                })
                .catch(function(err) {
                    console.error('callback from bi.rollSkill() err: ', err);
                    res.status(500).json({message: "Error: " + err});
                });
        });

    app.use('/api', router);
};


function checkAPIAuth(req, res, next) {
    console.log('checkAPIAuth() called. req.path: ', req.path);
    console.log('checkAPIAuth() called. req.isAuthenticated(): ', req.isAuthenticated());
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(403).json({message: "Forbidden."});
}

function checkUserHasServer(req, res, next) {
    if (req.params.server_id
        && req.user.guilds.length > 0
    ) {
        console.log('req.user.guilds: ', req.user.guilds);
        var server =
            _.find(req.user.guilds,
                (guild) => {
                    return guild.id == req.params.server_id
                }
            );
        if (server) {
            return next();
        }
    }
    res.status(403).json({message: "Forbidden."});
}

function userOwnsCharacter(user, player_id) {
    return (player_id && user.id && player_id == user.id);
}

function checkUserOwnsCharacter(req, res, next) {
    if (userOwnsCharacter(req.user, req.params.player_id)) {
        return next();
    }
    res.status(403).json({ message: "Forbidden"});
}