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
    router.get('/guilds',
        function (req, res) {
            console.log('/guilds called. req.user: ', req.user);
            bi.getGuilds()
                .then(function (guilds) {
                    console.log('/guilds guilds: ', guilds);
                    guilds =
                        _.intersectionBy(guilds, req.user.guilds, ((guild) => guild.id))
                            .map((guild) => {
                                return {id: guild.id, icon: guild.icon, name: guild.name};
                            });
                    Promise.all(guilds.map((guild) => {
                            return Charsheet.loadBy({guild_id: guild.id})
                                .then(function (charsheets) {
                                    guild.characters = charsheets;
                                    return guild;
                                });
                        })
                    ).then(function (guilds) {
                        console.log('returning guilds: ', guilds);
                        res.json({guilds: guilds});
                    });
                })
                .catch(function (err) {
                    console.error('Error asking fatebot for guilds: ', err);
                    res.json({guilds: []});
                });
        });

    router.get('/guild/:guild_id',
        checkUserHasGuild,
        function (req, res) {
            console.log('/api/guilds/:guild_id/characters called. guild_id: ', req.params.guild_id);
            bi.getGuild(req.params.guild_id)
                .then(function (guild) {
                    Charsheet.loadBy({guild_id: req.params.guild_id})
                        .then(function (charsheets) {
                            res.json({
                                id: guild.id,
                                icon: guild.icon,
                                name: guild.name,
                                characters: charsheets
                            });
                        })
                        .catch(function (err) {
                            res.status(500).json({message: "Error: " + err});
                        });
                })
                .catch(function (err) {
                    console.error('Error asking fatebot for guilds: ', err);
                    res.status(404).json({message: "Not found."});
                });
        }
    );

    router.get('/guild/:guild_id/character/:player_id',
        checkUserHasGuild,
        function (req, res) {
            console.log('/api/guilds/:guild_id/characters called. guild_id: ', req.params.guild_id);
            bi.getGuild(req.params.guild_id)
                .then(function (guild) {
                    Charsheet.loadBy({guild_id: req.params.guild_id, player_id: req.params.player_id})
                        .then(function (charsheets) {
                            var charsheet = charsheets[0];
                            charsheet.guild_name = guild.name;
                            charsheet.guild_icon = guild.icon;
                            charsheet.is_owner = userOwnsCharacter(req.user, charsheet.player_id);
                            res.json(charsheet);
                        })
                        .catch(function (err) {
                            res.status(500).json({message: "Error: " + err});
                        });
                })
                .catch(function (err) {
                    console.error('Error asking fatebot for guilds: ', err);
                    res.status(404).json({message: "Not found."});
                });
        }
    );

    router.get('/guild/:guild_id/character/:player_id/:skill/roll/:description?',
        checkUserHasGuild,
        checkUserOwnsCharacter,
        function (req, res) {
            console.log('/guilds/:guild_id/character/:player_id/:skill/roll called. req.params: ', req.params);
            bi.rollSkill(req.params.guild_id, req.params.player_id, req.params.skill, req.params.description)
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

function checkUserHasGuild(req, res, next) {
    if (req.params.guild_id
        && req.user.guilds.length > 0
    ) {
        console.log('req.user.guilds: ', req.user.guilds);
        var guild =
            _.find(req.user.guilds,
                (guild) => {
                    return guild.id == req.params.guild_id
                }
            );
        if (guild) {
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