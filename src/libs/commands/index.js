/**
 * Created by jhelmuth on 7/3/16.
 */

/**
 * This component loads the bot commands from all the other modules in this directory, adding them to a base
 * set of commands.
 *
 * It exports all of the commands as 'commands', and the function to add more commands as `addCommand()` function
 *
 */

var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
Promise.promisifyAll(fs);

// list a base set of commands for the bot to use
// key=what the user types, value=object with "func", "roles", and "describe" keys,
// used for the function to run, the Discord "roles" the user must have to run the command,
// and what text to display when the user types !help
var commands = {
	"ping": {
		"func": function (bot, msg, parsed) {
            msg.reply("pong");
			return true;
		},
		"describe": "Serve up a very short game of ping-pong.",
		"roles": []
	},
	"superping": {
		"func": function(bot, msg, parsed) {
            msg.reply("superpong");
		},
		"no_help": true,
		"roles": ["@fatebotowner"]
	},
	"unknown_command": {
		"func": unknown_response,
		"no_help": true,
		"roles": []
	}
};

var commands_added_count = 0;
function addCommand(cmd, funcspec) {
	if (_.isString(cmd)) {
		var cmd_spec = {
			func: null,
			roles: []
		};
		if (_.isFunction(funcspec)) {
			cmd_spec.func = funcspec;
		} else if (_.isObject(funcspec)) {
			if (funcspec.hasOwnProperty('func')
					&& _.isFunction(funcspec.func)
			) {
				cmd_spec.func = funcspec.func;
			}
			if (funcspec.hasOwnProperty('roles')
					&& _.isArray(funcspec.roles)
			) {
				cmd_spec.roles = funcspec.roles;
			}
			if (funcspec.hasOwnProperty('no_help')) {
				cmd_spec.no_help = funcspec.no_help;
			}
			if (funcspec.hasOwnProperty('describe')
				&& _.isString(funcspec.describe)
			) {
				cmd_spec.describe = funcspec.describe;
			}
		}
		if (_.isFunction(cmd_spec.func)) {
			console.log('adding cmd: ', cmd);
			commands[cmd] = cmd_spec;
			commands_added_count++;
		}
	}
}

var plugindir = __dirname;
fs.readdirAsync(plugindir)
	.then(function (files) {
		console.log('reading plugin files: ', files);
		return files
			.filter(function (filename) {
				return filename != 'index.js';
			})
			.map(function (filename) {
				console.log('reading plugin file ' + filename);
				var cmds = require(path.join(plugindir, filename));
				console.log('plugin file ' + filename + ': ', cmds);
				_.forEach(cmds, function(func_spec, cmd) {
					console.log('calling addCommand() with [cmd, func_spec]: ', [cmd, func_spec]);
					addCommand(cmd, func_spec);
				});
				return true;
			})
			.filter(function (res) {
				if (res) {
					return res;
				}
				return false;
			});
	})
	.then(function(results) {
		console.log('Loaded ' + results.length + ' command plugins, ' + commands_added_count + ' separate commands.');
	})
	.catch(function (err) {
		console.error('error loading commands: ', err);
	});

module.exports = {
	addCommand: addCommand,
	commands: commands
};


var unknown_cmd_replies = [
	"What!?",
	"I don't even know what that means.",
	"What you talking about?",
	"Hey, whatever it is you're smoking, you should share it.",
	"Does not compute.  Please re-enter command.",
	"Invalid syntax",
	"Divide by zero error, rebooting universe.",
	"I don't know how to go there."
];
function unknown_response(bot, msg, parsed) {
    msg.reply(_.sample(unknown_cmd_replies));
}