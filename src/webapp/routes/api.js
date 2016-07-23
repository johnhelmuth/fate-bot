/**
 * Created by jhelmuth on 7/24/16.
 */

var auth = require("../auth");
var _ = require('lodash');
var Promise = require('bluebird');
var Charsheet = require('../../libs/charsheet');
var express = require('express');
var Diceroller = require('../../libs/diceroller');

module.exports = function (app, fatebot) {
    var router = express.Router();
    router.use(checkAuth);
    router.get('/servers',
        function (req, res) {
            var fb;
            console.log('/servers called. req.user: ', req.user);
            if (fb = fatebot(req)) {
                var servers =
                    _.intersectionBy(fb.servers, req.user.guilds, ((server) => server.id))
                        .map((server) => {
                            return {id: server.id, icon: server.icon, name: server.name};
                        });
                console.log('servers before adding characters: ', servers);
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
                return;
            }
            console.log('returning empty servers.');
            res.json({servers: []});
        });

    router.get('/server/:server_id',
        checkUserHasServer,
        function (req, res) {
            console.log('/api/servers/:server_id/characters called. server_id: ', req.params.server_id);
            if (fb = fatebot(req)) {
                var server =
                    _.find(
                        _.intersectionBy(fb.servers, req.user.guilds, ((server) => server.id)),
                        (server) => {
                            return server.id == req.params.server_id;
                        }
                    );
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
            } else {
                res.status(404).json({message: "Not found."});
            }
        }
    );

    router.get('/server/:server_id/character/:player_id',
        checkUserHasServer,
        function (req, res) {
            console.log('/api/servers/:server_id/characters called. server_id: ', req.params.server_id);
            if (fb = fatebot(req)) {
                console.log('fb is set');
                var server = fb.servers.get('id', req.params.server_id);
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
            } else {
                res.status(404).json({message: "Not found."});
            }
        }
    );

    router.get('/server/:server_id/character/:player_id/:skill/roll/:description?',
        checkUserHasServer,
        checkUserOwnsCharacter,
        function (req, res) {
            console.log('/servers/:server_id/characte/:player_id/:skill/rollr called. req.params: ', req.params);
            var fb;
            var user;
            var server;
            if ((fb = fatebot(req))
                && (server = fb.servers.get('id', req.params.server_id))
                && (user = server.members.get('id', req.params.player_id))
            ) {
                console.log('fb is set');
                Charsheet.loadBy({server_id: req.params.server_id, player_id: user.id})
                    .then(function (charsheets) {
                        var char = charsheets[0];
                        if (char.skills.hasOwnProperty(req.params.skill)) {
                            var skill_val = char.skills[req.params.skill];
                            if (skill_val < 0) {
                                skill_val = '-' + Math.abs(skill_val);
                            } else {
                                skill_val = '+' + Math.abs(skill_val);
                            }
                            var descrip = (req.params.description || '');
                            var diespec = `4df${skill_val} ${descrip}`;
                            console.log('/server skill roll diespec: ', diespec);
                            var roller = new Diceroller(diespec).roll();
                            roller.as_string = roller.toString();
                            sendMessage(fb, server, user,
                                `${char.name} (${user}) rolled ${req.params.skill} ${roller.as_string}`
                            );
                            res.json({roll: roller});
                        } else {
                            res.status(404).json({message: "Not found."});
                        }
                    })
                    .catch(function (err) {
                        res.status(500).json({message: "Error: " + err});
                    });
            } else {
                res.status(404).json({message: "Not found."});
            }
        });

    app.use('/api', router);
};


function checkAuth(req, res, next) {
    console.log('checkAuth() called. req.path: ', req.path);
    console.log('checkAuth() called. req.isAuthenticated(): ', req.isAuthenticated());
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

function sendMessage(fatebot, server, user, message) {
    console.log('sendMessage() user: ', user);
    console.log('sendMessage() server: ', server);
    var channel = getTextChannel(server, 'general');
    console.log('sendMessage() general text channel: ', channel);
    fatebot.sendMessage(channel, message);
}

function getTextChannel(server, channel_name) {
    return server.channels.getAll('name', channel_name).get('type', 'text');
}