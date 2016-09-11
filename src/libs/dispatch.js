/**
 * Created by jhelmuth on 6/19/16.
 *
 * dispatch function
 *
 * Handles messages from the Discord App and dispatches appropriately to the command function.
 */

var Discord = require("discord.js");
var _ = require('lodash');

var Cmd = require('./commands');
var commands = Cmd.commands;

var cmd_prefix = '!';

// Add the help command to the list of commands supported.
Cmd.addCommand('help', {
	"func": help,
	"describe": "Display the help."
});

/**
 * Given a Client bot and a Message, do the thing the message is asking.
 *
 * @param {Client} bot
 * @param {Message} message
 * @returns {*}
 */
function dispatch(bot, message) {
	if (message.author.id == bot.user.id) {
		// ignore messages I send out.
		return false;
	}
	var msg_text = message.content;
	console.log('dispatch() msg_text: ', msg_text);
	console.log('dispatch() author (id, username): ', [message.author.id, message.author.username]);

	var parsed = parse(msg_text);
	console.log('dispatch() parsed: ', parsed);

	if (parsed.cmd) {
		var cmd_spec = null;
		if (commands.hasOwnProperty(parsed.cmd)
			&& _.isFunction(commands[parsed.cmd].func)
		) {
			cmd_spec = commands[parsed.cmd];
		} else if (commands.hasOwnProperty('unknown_command')
			&& _.isFunction(commands.unknown_command.func)
		) {
			cmd_spec = commands.unknown_command;
		} else {
			return message.reply('What?!');
		}
		if (commandAllowed(message, cmd_spec)) {
			return cmd_spec.func(bot, message, parsed);
		} else {
            message.reply("You don't have permissions to do that.");
		}
	}
	return false;
}

/**
 * Parse message text into a data structure that can be used by plugins.
 *
 * @param {String} msg_text
 * @returns {{text: *, cmd: string, tokens: Array, rest_of_message: parsed.rest_of_message}}
 */
function parse(msg_text) {
	var parsed = {
		text: msg_text,
		cmd: 'default',
		tokens: [],
		rest_of_message: function () {
			return this.tokens.join(' ');
		}
	};
	var tokens = msg_text.split(' ');
	if (isCommand(tokens[0])) {
		if (tokens[0].length > 1) {
			parsed.cmd = tokens.shift().substr(1).toLowerCase(); // drop initial marker
		} else {
			tokens.shift(); // drop the empty ! from the tokens list_all
		}
	} else {
		parsed.cmd = false;
	}
	parsed.tokens = tokens;
	return parsed;
}

/**
 * Does this message start with a command?
 *
 * @param {String} msg_text
 * @returns {boolean}
 */
function isCommand(msg_text) {
	return (msg_text[0] == cmd_prefix);
}

/**
 * Set the prefix used to trigger commands
 *
 * @param {String} cmd_pref
 */
function setCmdPrefix(cmd_pref) {
	cmd_prefix = cmd_pref;
}

/**
 * Configure the dispatch library.
 *
 * @param {Function} cfg
 */
function config(cfg) {
	var cmd_pref = cfg('prefix');
	if (cmd_pref) {
		setCmdPrefix(cmd_pref);
	}
}

// permission checking functions

/**
 *
 * @param {Guild} guild
 * @param {String} role_name
 *
 * @returns {Role}
 */
function findRole(guild, role_name) {
	return guild.roles.get('name', role_name);
}

/**
 * Does user have rolle on server?
 *
 * @param {Guild} guild
 * @param {User} user
 * @param {String} role
 * @returns {boolean}
 */
function hasRole(guild, user, role) {
	var role_obj;
	if (role_obj = findRole(guild, role)) {
		return user.client.memberHasRole(user, role_obj);
	}
	return false;
}

/**
 * Does the author of the message have all of the roles?
 *
 * @param {Message} message
 * @param {Array} roles
 * @returns {boolean}
 */
function userAllowed(message, roles) {
	if (! message.channel instanceof Discord.GuildChannel) {
		return false;
	}
	for (var i = 0; i < roles.length; i++) {
		if (!hasRole(message.channel.guild, message.author, roles[i])) {
			return false;
		}
	}
	return true;
}

/**
 * is the selected command allowed to the author of the message?
 *
 * @param {Object} cmd_spec
 * @param {Message} message
 * @returns {boolean}
 */
function commandAllowed(cmd_spec, message) {
	if (!_.isEmpty(cmd_spec.roles)) {
		if (! _.isArray(cmd_spec.roles)) {
			return false;
		}
		return userAllowed(message, cmd_spec.roles);
	} else {
		return true;
	}
}

module.exports = {dispatch: dispatch, setCmdPrefix: setCmdPrefix, config: config };

/**
 * Command function to display help
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function help(bot, msg, parsed) {
	var output = "***Need help?***\n\n";
	output += "\tThe command prefix is '" + cmd_prefix + "'\n\n";
	_.forEach(commands, function (cmd_spec, cmd) {
		if (cmd_spec.hasOwnProperty('no_help') && cmd_spec.no_help) {
			return;
		}
		output += '*' + cmd_prefix + cmd + '*';
		if (cmd_spec.hasOwnProperty("describe")
			&& cmd_spec.describe
		) {
			output += ":\t\t" + cmd_spec.describe;
		}
		output += "\n";
	});
	output += "\n";
	msg.reply(output);
}