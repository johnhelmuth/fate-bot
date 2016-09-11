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
    var guild = fatebot.guilds.find('id', msg.guild_id);
    var guild_member = guild.members.find('id', msg.user_id);
    console.log('rollSkill() guild.id: ', guild.id);
    console.log('rollSkill() guild_member.id: ', guild_member.id);
    console.log('rollSkill() skill: ', msg.skill);
    console.log('rollSkill() description: ', msg.description);
    if (guild && guild_member) {
        return Charsheet.loadByPlayerAndGuild(guild_member.id, guild.id)
            .then(function (char) {
                console.log('rollSkill() char.guild_id: ', char.guild_id);
                console.log('rollSkill() char.player_id: ', char.player_id);
                if (msg.guild_id != char.guild_id || msg.user_id != char.player_id) {
                    console.error('something is wrong, msg and charsheet should match guild_id and player_id');
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
                    sendMessage(guild, guild_member,
                        `${char.name} (@${guild_member.user.username}) rolled ${skill} ${roller.as_string}`
                    );
                    return {roll: roller};
                }
                return false;
            });
    }
    return Promise.resolve(false);
}

function discordGuildToObj(guild) {
    return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        members: guild.members.array().map((member) => {
            console.log('discordGuildToObj() member: ', member);
            return discordGuildMemberToObj(member);
        })
    };
}

function discordGuildMemberToObj(member) {
    return {
        id: member.user.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.avatar,
        nick: member.nickname,
        status: member.user.status
    };
}

function sendMessage(guild, guild_member, message) {
    if (guild.defaultChannel.type == 'text') {
        return guild.defaultChannel.sendMessage(message);
    }
}

var message_map = {
    "guilds": {
        func: function getGuilds(fatebot) {
            var guilds = _.map(fatebot.guilds.array(), function (guild) {
                return discordGuildToObj(guild);
            });
            return Promise.resolve(guilds);
        }
    },
    "guild": {
        func: function getGuild(fatebot, msg) {
            console.log('getGuild() msg: ', msg);
            var guild_id = msg.id;
            console.log('getGuild() guild_id: ', guild_id);
            var guild = false;
            var fb_guild;
            console.log('getGuild() fatebot.guilds.find("id", guild_id): ', fatebot.guilds.find("id", guild_id));

            if (guild_id && (fb_guild = fatebot.guilds.find("id", guild_id))) {
                console.log('fb_guild: ', fb_guild);
                guild = discordGuildToObj(fb_guild);
                console.log('output guild: ', guild);
            }
            return Promise.resolve(guild);
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
                user = discordGuildMemberToObj(fb_user);
            }
            return Promise.resolve(user);
        }
    },

    "roll_skill": {
        func: rollSkill
    }
};

