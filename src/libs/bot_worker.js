/**
 * Created by jhelmuth on 8/7/16.
 */

var rabbit = require('./rabbit');
var _ = require('lodash');
var Promise = require('bluebird');

var Charsheet = require('./charsheet');
var Diceroller = require('./diceroller');

module.exports = function (fatebot) {
    return rabbit()
        .then(function (ch) {
                console.log('rabbitmq ch: ', ch);
                var q = 'fatebot_rpc';
                return ch.assertQueue(q, {durable: false})
                    .then(function () {
                        ch.prefetch(1);
                        return ch.consume(q, handleMsg);
                    })
                    .then(function (ch) {
                        console.log('Awaiting worker requests.');
                        return ch;
                    });

                function handleMsg(msg) {
                    console.log('handleMsg() msg received from ' + q + ' queue.');
                    var parsed_msg = JSON.parse(msg.content.toString());
                    console.log('handleMsg() Parsed_msg: ', parsed_msg);
                    var func_requested = parsed_msg.func;
                    var result = Promise.resolve(false);
                    if (message_map.hasOwnProperty(func_requested)
                        && message_map[func_requested].hasOwnProperty('func')
                    ) {
                        console.log('handleMsg() function requested found in message_map.');
                        result = message_map[func_requested].func(fatebot, parsed_msg);
                        console.log('handleMsg() result: ', result);
                    } else {
                        console.log('handleMsg() function requested not found in message_map.');
                        console.log('handleMsg() func_requested: ', func_requested);
                        console.log('handleMsg() message_map: ', message_map);
                    }
                    result.then(function(res) {
                        ch.sendToQueue(
                            msg.properties.replyTo,
                            new Buffer(JSON.stringify(res)),
                            {correlationId: msg.properties.correlationId}
                        );
                        ch.ack(msg);
                    });
                }
            },
            console.error
        );
};

function rollSkill(fatebot, msg) {
    var server = fatebot.servers.get('id', msg.server_id);
    var user = server.members.get('id', msg.user_id);
    console.log('rollSkill() server.id: ', server.id);
    console.log('rollSkill() user.id: ', user.id);
    console.log('rollSkill() skill: ', msg.skill);
    console.log('rollSkill() description: ', msg.description);
    if (server && user) {
        return Charsheet.loadByPlayerAndServer(user.id, server.id)
            .then(function (char) {
                console.log('rollSkill() char.server_id: ', char.server_id);
                console.log('rollSkill() char.player_id: ', char.player_id);
                if (msg.server_id != char.server_id || msg.user_id != char.player_id) {
                    console.error('something is wrong, msg and charsheet should match server_id and player_id');
                    return false;
                }
                console.log('rollSkill() char: ', char);
                var skill = msg.skill;
                if (char.skills.hasOwnProperty(skill)) {
                    var skill_val = char.skills[skill];
                    if (skill_val < 0) {
                        skill_val = '-' + Math.abs(skill_val);
                    } else {
                        skill_val = '+' + Math.abs(skill_val);
                    }
                    var description = (msg.description || '');
                    var diespec = `4df${skill_val} ${description}`;
                    console.log('rollSkill() skill roll diespec: ', diespec);
                    var roller = new Diceroller(diespec).roll();
                    roller.as_string = roller.toString();
                    sendMessage(fatebot, server, user,
                        `${char.name} (${user}) rolled ${skill} ${roller.as_string}`
                    );
                    return {roll: roller};
                }
                return false;
            });
    }
    return Promise.resolve(false);
}

function discordServerToObj(server) {
    return {
        id: server.id,
        name: server.name,
        icon: server.icon,
        members: server.members.map((member) => {
            return discordUserToObj(member, server);
        })
    };
}

function discordUserToObj(user, server) {
    var user_details = { nick: '' };
    if (server) {
        user_details = server.detailsOfUser(user);
    }
    return {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        nick: user_details.nick,
        status: user.status
    };
}

function sendMessage(fatebot, server, user, message) {
    var channel = getTextChannel(server, 'general');
    fatebot.sendMessage(channel, message);
}

function getTextChannel(server, channel_name) {
    return server.channels.getAll('name', channel_name).get('type', 'text');
}

var message_map = {
    "servers": {
        func: function getServers(fatebot) {
            var servers = _.map(fatebot.servers, function (server) {
                return discordServerToObj(server);
            });
            return Promise.resolve(servers);
        }
    },
    "server": {
        func: function getServer(fatebot, msg) {
            console.log('getServer() msg: ', msg);
            var server_id = msg.id;
            console.log('getServer() server_id: ', server_id);
            var server = false;
            var fb_server;
            if (server_id && (fb_server = fatebot.servers.get("id", server_id))) {
                console.log('fb_server: ', fb_server);
                server = discordServerToObj(fb_server);
                console.log('output server: ', server);
            }
            return Promise.resolve(server);
        }
    },
    "has_user": {
        func: function hasUser(fatebot, msg) {
            var user_id = msg.id;
            var has_user = false;
            if (user_id && fatebot.users.get(user_id)) {
                has_user = true;
            }
            return Promise.resolve(has_user);
        }
    },
    "user": {
        func: function getUser(fatebot, msg) {
            var user_id = msg.id;
            var user = false;
            if (user_id && (fb_user = fatebot.users.get(user_id))) {
                user = discordUserToObj(fb_user);
            }
            return Promise.resolve(user);
        }
    },

    "roll_skill": {
        func: rollSkill
    }
};

