/**
 * Created by jhelmuth on 7/3/16.
 *
 * Fatebot commands dealing with the Charsheet data structure.
 *
 */

// model classes
var Charsheet = require('../charsheet');

// other bot commands we need to use with these bot commands
var dice = require('./dice');

// libraries
var Discord = require("discord.js");
var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
var jsonfile = require('jsonfile');

// make these libraries use Promises.
Promise.promisifyAll(fs);
Promise.promisifyAll(jsonfile);

// list of commands for the bot to use
// key=what the user types, value=object with "func", "roles", and "describe" keys,
// used for the function to run, the Discord "roles" the user must have to run the command,
// and what text to display when the user types !help
module.exports = {
	"skill_pyramid": {
		"func": skill_pyramid,
		"describe": "Display character sheet skills in skill pyramid form."
	},
	"no_skill_pyramid": {
		"func": no_skill_pyramid,
		"describe": "Display character sheet skills in linear form."
	},
	"char": {
		"func": char_cmd,
		"describe": "Work with character sheets, subcommands available: \n"
								+ "\t*!char* Display your character sheet.\n"
								+ "\t*!char @player* Displays another @player's character.\n"
								+ "\t*!char set <property> <value>* Sets the property on the character\n"
								+ "\t*!char dump* Outputs the character in JSON format.\n"
	},
	"look": {
		"func": look,
		"describe": "*!look @player* Displays another @player's character."
	},
	"aspects": {
		"func": list_aspects,
		"describe": "Lists all character aspects"
	},
	"random": {
		"func": random_aspect,
		"describe": "Picks a random aspect from all the characters on the server."
	},
	"dump": {
		"func": dump,
		"describe": "Dumps the character sheet in JSON format"
	},
	"load": {
		"func": load,
		"describe": "Loads the character sheet from the message (in JSON format) into the database"
	},
	"list_all": {
		"func": list_all,
		"describe": "Lists all characters on the server"
	},
	"load_other": {
		"func": load_other,
		"roles": ["@fatebotowner"],
		"describe": "Owner only. Loads the character sheet from the message (in JSON format) into another player's character sheet in the database."
	},
	"default": {
		"func": fate_default,
		"describe": "Rolls the dice, use *! fight* (for example), to add your Fight skill bonus to the roll."
	}
};

/**
 * Format skills like a skill pyramid
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function skill_pyramid(bot, msg, parsed) {
	Charsheet.setSkillPyramid(true);
	bot.reply(msg, 'Set Skill Pyramid Output to true.');
}

/**
 * Format skills like a simple alphabetical list
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function no_skill_pyramid(bot, msg, parsed) {
	Charsheet.setSkillPyramid(false);
	bot.reply(msg, 'Set Skill Pyramid Output to false.');
}

/**
 * Utility function to get a server_id from a message
 *
 * @param {Message} message
 * @returns {null|String}
 */
function getServerId(message) {
	console.log('getServerId() message: ', message);
	var server_id = null;
	if (message.channel instanceof Discord.ServerChannel) {
		console.log('getServerId() message has a ServerChannel.');
		server_id = message.channel.server.id;
	}
	console.log('getServerId() server_id: ', server_id);
	return server_id;
}

/**
 * Handle commands that start with !char... set, look, dump, default is to display character sheet
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function char_cmd(bot, msg, parsed) {
	var user = msg.author;
	var user_id = user.id;
	var server_id = getServerId(msg);
	console.log('user_id: ', user_id);
	console.log('server_id: ', server_id);
	var char = getCharForUser(user_id, server_id);
	console.log('parsed.tokens: ', parsed.tokens);
	if (parsed.tokens.length) {
		var subcmd;

		if (msg.mentions.length) {
			parsed.tokens.shift(); // drop the mentioned user
			subcmd = 'look';
		}
		if (! subcmd) {
			subcmd = parsed.tokens.shift().toLowerCase();
		}
		console.log('subcmd: ', subcmd);
		var name;
		switch (subcmd) {
		case 'set':
			if (parsed.tokens.length) {
				var attribute = parsed.tokens.shift();
				var default_val = Charsheet.getDefaultAttr(attribute);
				if (_.isString(default_val) || _.isInteger(default_val)) {
					char
						.then(function (char) {
							char.set(attribute, parsed.rest_of_message().trim());
							return char.save();
						})
						.then(function (char) {
							replyWithChar(bot, msg, attribute + ' set:', char);
						})
						.catch(function (err) {
							replyWithErr(bot, msg, err);
						});
				} else if (_.isObject(default_val)) {
					if (parsed.rest_of_message().length) {
						name = parsed.tokens.shift();
						char
							.then(function (char) {
								if (char.hasOwnProperty(name) && _.isFunction(char[name])) {
									char[name](name, parsed.rest_of_message().trim());
									return char.save();
								}
							})
							.then(function (char) {
								replyWithChar(bot, msg, _.capitalize(attribute) + ' set:', char);
							})
							.catch(function (err) {
								replyWithErr(bot, msg, err);
							});
					} else {
						replyWithErr(bot, msg, 'No aspect specified.');
					}
				}
			} else {
				replyWithErr(bot, msg, 'No field specified.');
			}
			break;

		case 'look':
			look(bot, msg, parsed);
			break;

		case 'dump':
			dump(bot, msg, parsed);
			break;
		}
	} else {
		char
			.then(function (char) {
				console.log('char returned from getCharForUser(' + user_id + ', ' + server_id + '): ', char);
				replyWithChar(bot, msg, '', char);
			})
			.catch(function (err) {
				bot.reply(msg, "An error occurred while looking for your character sheet to display: " + err);
			})
	}
}

/**
 * What to do as a default, if just the command prefix character is typed?
 * In this case, roll the dice, possibly based on a skill from the user's character sheet.
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function fate_default(bot, msg, parsed) {
	if (parsed.tokens.length) {
		var token = parsed.tokens.shift();
		var possible_skill = token.toLowerCase();
		var server_id = getServerId(msg);
		console.log('server_id: ', server_id);
		getCharForUser(msg.author.id, server_id)
			.then(function (char) {
				console.log('default command, char: ', char);
				console.log('char.skills: ', char.skills);
				if (char.skills.hasOwnProperty(possible_skill)) {
					var skill_val = char.skills[possible_skill];
					if (skill_val < 0) {
						skill_val = '-' + Math.abs(skill_val);
					} else {
						skill_val = '+' + Math.abs(skill_val);
					}
					parsed.tokens.unshift('(' + _.capitalize(token) + ')');
					parsed.tokens.unshift(skill_val);
					console.log('skill roll, parsed.tokens: ', parsed.tokens);
					dice.roll.func(bot, msg, parsed);
				} else {
					console.log('No skill entered on default command');
					parsed.tokens.unshift(token);
					dice.roll.func(bot, msg, parsed);
				}
			})
			.catch(function (err) {
				console.error('Failed to load char. err: ', err);
				parsed.tokens.unshift(token);
				dice.roll.func(bot, msg, parsed)
			});
	} else {
		dice.roll.func(bot, msg, parsed);
	}
}

// Utility functions

/**
 * Reply to the handled message, showing a character sheet.
 *
 * @param {Client} bot
 * @param {Message} tomsg
 * @param {String} msg
 * @param {Charsheet} char
 */
function replyWithChar(bot, tomsg, msg, char) {
	bot.reply(tomsg, msg + '\n' + char.toString());
}

/**
 * Reply to the handled message, with an error.
 *
 * @param {Client} bot
 * @param {Message} tomsg
 * @param {Error} err
 */
function replyWithErr(bot, tomsg, err) {
	bot.reply(tomsg, 'An error occurred: ' + err);
}

/**
 * Pull the character for the user / server combination
 *
 * @param {String} user_id
 * @param {String} server_id
 *
 * @return Promise that resolves to the Charsheet object.
 */
function getCharForUser(user_id, server_id) {
	return Charsheet.loadByPlayerAndServer(user_id, server_id)
		.then(function (char) {
			if (_.isEmpty(char)) {
				console.log('getCharForUser() no character found for user_id ' + user_id + ' server_id ' + server_id);
				var newchar = new Charsheet();
				newchar.player_id = user_id;
				newchar.server_id = server_id;
				console.log('getCharForUser() empty character generated: ', newchar);
				console.log('getCharForUser() calling newchar.save()');
				return newchar.save()
					.then(function (saved_char) {
						return saved_char;
					})
					.catch(function (err) {
						console.log('error: getCharForUser() unable to save new Charsheet for user_id: ', user_id, ' server_id: ', server_id, ' err: ', err);
					});
			}
			console.log('getCharForUser(' + user_id + ', ' + server_id + ') returning char: ', char);
			return char;
		});
}

/**
 * Look at another user's character sheet.
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function look(bot, msg, parsed) {
	console.log('msg.mentions.length: ', msg.mentions.length);
	console.log('msg.mentions[0]: ', msg.mentions[0]);
	if (msg.mentions.length) {
		var look_at = msg.mentions[0];
		console.log('look_at: ', look_at);
		var username = look_at.username;
		var look_at_id = look_at.id;
		getCharForUser(look_at_id, getServerId(msg))
			.then(function (look_at_char) {
				replyWithChar(bot, msg, "Looked at " + username + "'s character sheet:", look_at_char);
			}, function (err) {
				console.log('Error trying to load charsheet for user [' + look_at_id + ']. err: ', err);
				replyWithErr(bot, msg, 'No user specified.');
			});
	} else {
		replyWithErr(bot, msg, 'No user specified.');
	}
}

/**
 * List all character sheets for this server.
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function list_all(bot, msg, parsed) {
	var server_id = getServerId(msg);
	return Charsheet.loadBy({
		'server_id': server_id
	})
		.then(function(chars) {
			var output = "\nCharacter\tPlayer\tHC\tFP\n";
			chars.forEach(function(char) {
				output += char.name + "\t"
					+ char.player + "\t"
					+ char.aspects.HC + "\t"
					+ char.fate_points + "\n";
			});
			bot.reply(msg, output);
		})
		.catch(function(err) {
			replyWithErr(bot, msg, err);
		})
}

/**
 * Display a random aspect, from all of the character sheets on this server.
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function random_aspect(bot, msg, parsed) {
	var server_id = getServerId(msg);
	return Charsheet.loadBy({
			'server_id': server_id
		})
		.then(function (chars) {
			var which_char = _.sample(chars);
			var aspect = _.sample(which_char.aspects);
			bot.reply(msg, "\n" + which_char.name + ": ***" + aspect + "***\n");
		})
		.catch(function (err) {
			replyWithErr(bot, msg, err);
		});
}

/**
 * List all the character aspects on this server.
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function list_aspects(bot, msg, parsed) {
	var server_id = getServerId(msg);
	return Charsheet.loadBy({
			'server_id': server_id
		})
		.then(function (chars) {
			var output = "\nCharacter\t:\tAspect\n";
			chars.forEach(function (char) {
				_.forEach(char.aspects, function (aspect, key) {
					output += char.name + "\t:\t";
					if (_.isNumber(key)) {
						output += '***' + aspect + "***\n";
					} else {
						output += key + ': ***' + aspect + "***\n";
					}
				});
			});
			bot.reply(msg, output);
		})
		.catch(function (err) {
			replyWithErr(bot, msg, err);
		});
}

/**
 * dump JSON representation of character to chat
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function dump(bot, msg, parsed) {
	var server_id = getServerId(msg);
	console.log('server_id: ', server_id);
	getCharForUser(msg.author.id, server_id)
		.then(function (char) {
			bot.reply(msg, JSON.stringify(char.getData()));
		})
		.catch(function (err) {
			bot.reply(msg, err);
		});
}

/**
 * Load JSON representation of character from chat into the database
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function load(bot, msg, parsed) {
	return loadCharFromChat(bot, msg, parsed, msg.author.id);
}

/**
 * Utility function to load a character sheet from a chat message (JSON) and store it into the database for the given user_id
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 * @param {String} user_id
 */
function loadCharFromChat(bot, msg, parsed, user_id) {
	try {
		var server_id = getServerId(msg);
		var chardata = JSON.parse(parsed.rest_of_message());
		console.log('loadCharFromChat() chardata: ', chardata);
		if (chardata) {
			return Charsheet.loadByPlayerAndServer(user_id, server_id)
				.then(function (char) {
					if (char) {
						console.log('loadCharFromChat() found char record in database: char: ', char);
						// awkward!
						// already exists in database
						delete chardata.id;
						delete chardata._id;
						delete chardata.player_id;
						delete chardata.server_id;
						_.forEach(chardata, function (val, key) {
							if (Charsheet.isMultiple(key)) {
								_.forEach(val, function (newval, multikey) {
									char[key](multikey, newval);
								});
							} else {
								char.set(key, val);
							}
						});
						char.player_id = user_id;
						char.server_id = server_id;
						console.log('loadCharFromChat() updated, unsaved char: ', char);
					} else {
						// new record
						console.log('loadCharFromChat() no existing record in database.');
						delete chardata.id;
						chardata.player_id = user_id;
						chardata.server_id = server_id;
						console.log('loadCharFromChat() tweaked chardata: ', chardata);
						char = new Charsheet(chardata);
						console.log('loadCharFromChat() created, unsaved char: ', char);
					}
					console.log('loadCharFromChat() saving char');
					char.save()
						.then(function (saved_char) {
							console.log('loadCharFromChat() save() callback saved_char: ', saved_char);
							replyWithChar(bot, msg, "Character Saved.", saved_char);
						});
				});
		}
	} catch (err) {
		replyWithErr(bot, msg, err);
	}
}

/**
 * Load the character sheet from the chat message into the database, for some user other than the user who typed the message
 *
 * Permissions for this only allowed for users with the role @fatebotowner.  Might be a better way to do that.
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function load_other(bot, msg, parsed) {
	console.log('load_other() msg.mentions.length: ', msg.mentions.length);
	console.log('load_other() msg.mentions[0]: ', msg.mentions[0]);
	if (msg.mentions.length) {
		var load_other = msg.mentions[0];
		parsed.tokens.shift(); // drop the mention string from the msg
		console.log('load_other() parsed.rest_of_message()', parsed.rest_of_message());
		console.log('load_other() load_other: ', load_other);
		return loadCharFromChat(bot, msg, parsed, load_other.id);
	}
}

