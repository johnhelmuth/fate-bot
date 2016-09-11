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
    "skills": {
        "func": skill_list,
        "describe": "Lists peak skills of all characters on the server, or all the characters ratings in a given skill"
    },
	"random": {
		"func": random_aspect,
		"describe": "Picks a random aspect from all the characters on the server."
	},
    "list_all": {
        "func": list_all,
        "describe": "Lists all characters on the server"
    },
	"dump": {
		"func": dump,
		"describe": "Dumps the character sheet in JSON format"
	},
	"load": {
		"func": load,
		"describe": "Loads the character sheet from the message (in JSON format) into the database"
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
    msg.reply('Set Skill Pyramid Output to true.');
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
    msg.reply('Set Skill Pyramid Output to false.');
}

/**
 * Utility function to get a guild_id from a message
 *
 * @param {Message} message
 * @returns {null|String}
 */
function getGuildId(message) {
	console.log('getGuildId() message: ', message);
	var guild_id = null;
	if (message.channel.type == 'text') {
		console.log('getGuildId() message is on a text channel.');
		guild_id = message.channel.guild.id;
	}
	console.log('getGuildId() guild_id: ', guild_id);
	return guild_id;
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
	var guild_id = getGuildId(msg);
	console.log('user_id: ', user_id);
	console.log('guild_id: ', guild_id);
	var char = getCharForUser(user_id, guild_id);
	console.log('parsed.tokens: ', parsed.tokens);
	if (parsed.tokens.length) {
		var subcmd;
		if (msg.mentions.users.size) {
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
                console.log('char set attribute: ', attribute);
                console.log('char set default_val: ', default_val);
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
				} else if (Charsheet.isMultiple(attribute)) {
				    console.log(attribute + ' is an aggregate attribute');
					if (parsed.rest_of_message().length) {
						name = parsed.tokens.shift();
                        console.log('char set name: ', name);
						char
							.then(function (char) {
                                console.log('char set got char');
                                console.log('char set attribute: ', attribute);
                                console.log('char set char.hasOwnProperty(attribute): ', char.hasOwnProperty(attribute));
                                console.log('char set _.isFunction(char[attribute]): ', _.isFunction(char[attribute]));
                                if (_.isFunction(char[attribute])) {
                                    console.log('char set trying to call ', attribute, ' with ', name, parsed.rest_of_message().trim());
                                    char[attribute](name, parsed.rest_of_message().trim());
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
				} else {
                    replyWithErr(bot, msg, "I don't know what that field is.");
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
				console.log('char returned from getCharForUser(' + user_id + ', ' + guild_id + '): ', char);
				replyWithChar(bot, msg, '', char);
			})
			.catch(function (err) {
                msg.reply("An error occurred while looking for your character sheet to display: " + err);
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
		var guild_id = getGuildId(msg);
		console.log('guild_id: ', guild_id);
		getCharForUser(msg.author.id, guild_id)
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
    tomsg.reply(msg + '\n' + char.toString());
}

/**
 * Reply to the handled message, with an error.
 *
 * @param {Client} bot
 * @param {Message} tomsg
 * @param {Error} err
 */
function replyWithErr(bot, tomsg, err) {
    tomsg.reply('An error occurred: ' + err);
}

/**
 * Pull the character for the user / server combination
 *
 * @param {String} user_id
 * @param {String} guild_id
 *
 * @return Promise that resolves to the Charsheet object.
 */
function getCharForUser(user_id, guild_id) {
	return Charsheet.loadByPlayerAndGuild(user_id, guild_id)
		.then(function (char) {
			if (_.isEmpty(char)) {
				console.log('getCharForUser() no character found for user_id ' + user_id + ' guild_id ' + guild_id);
				var newchar = new Charsheet();
				newchar.player_id = user_id;
				newchar.guild_id = guild_id;
				console.log('getCharForUser() empty character generated: ', newchar);
				console.log('getCharForUser() calling newchar.save()');
				return newchar.save()
					.then(function (saved_char) {
						return saved_char;
					})
					.catch(function (err) {
						console.log('error: getCharForUser() unable to save new Charsheet for user_id: ', user_id, ' guild_id: ', guild_id, ' err: ', err);
					});
			}
			console.log('getCharForUser(' + user_id + ', ' + guild_id + ') returning char: ', char);
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
	console.log('msg.mentions.users.size: ', msg.mentions.users.size);
	console.log('msg.mentions.users.first(): ', msg.mentions.users.first());
	if (msg.mentions.users.size) {
		var look_at = msg.mentions.users.first();
		console.log('look_at: ', look_at);
		var username = look_at.username;
		var look_at_id = look_at.id;
		getCharForUser(look_at_id, getGuildId(msg))
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
	var guild_id = getGuildId(msg);
	return Charsheet.loadBy({
		'guild_id': guild_id
	})
		.then(function(chars) {
			var output = "\nCharacter\tPlayer\tHC\tFP\n";
			chars.forEach(function(char) {
				output += char.name + "\t"
					+ char.player + "\t"
					+ char.aspects.HC + "\t"
					+ char.fate_points + "\n";
			});
            msg.reply(output);
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
	var guild_id = getGuildId(msg);
	return Charsheet.loadBy({
			'guild_id': guild_id
		})
		.then(function (chars) {
			var which_char = _.sample(chars);
			var aspect = _.sample(which_char.aspects);
            msg.reply("\n" + which_char.name + ": ***" + aspect + "***\n");
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
	var guild_id = getGuildId(msg);
	return Charsheet.loadBy({
			'guild_id': guild_id
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
            msg.reply(output);
		})
		.catch(function (err) {
			replyWithErr(bot, msg, err);
		});
}

/**
 * Show a list of characters skills, either peak skills
 * or a specific skill from all characters
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function skill_list(bot, msg, parsed) {
    var guild_id = getGuildId(msg);
    var which_skill;
    if (parsed.tokens.length >= 1) {
        which_skill = parsed.tokens.shift();
    }
    return Charsheet.loadBy({
            'guild_id': guild_id
        })
        .then(function (chars) {
            var output;
            if (which_skill) {
                output = "\nCharacter\t:\t**" + Charsheet.displayAttribute(which_skill) + "** Rank\n";
            } else {
                output = "\nCharacter\t:\tSkill\t:\tRank\n";
            }
            sortCharsSkills(chars, which_skill)
                .forEach(function (skill) {
                output += skill.name + "\t:\t";
                if (!which_skill) {
                    output += "**" + Charsheet.displayAttribute(skill.skill) + "**\t:\t";
                }
                output += "***" + Charsheet.displayRating(skill.rating) + "***\n";
            });
            msg.reply(output);
        })
        .catch(function (err) {
            replyWithErr(bot, msg, err);
        });
}

/**
 * Sort a list of characters' skills by rating
 *
 * @param {Charsheet[]} chars
 * @param {string|null} which_skill
 * @returns {Object[]}
 */
function sortCharsSkills(chars, which_skill) {
    return chars.map(function (char) {
        var skill_name;
        var skill_value;
        if (!which_skill) {
            skill_name = getPeakSkill(char.skills).skill;
        } else {
            skill_name = which_skill.toLowerCase();
        }
        if (char.skills.hasOwnProperty(skill_name)) {
            skill_value = char.skills[skill_name];
        } else {
            skill_value = 0;
        }
        return {
            name: char.name,
            skill: skill_name,
            rating: skill_value
        };
    }).sort(function (a, b) {
        return b.rating - a.rating;
    });
}

/**
 * Get the highest ranked skill in a list of skills
 *
 * @param {Object} skills - keys are skill names, values are ratings
 *
 * @returns {Object}
 */
function getPeakSkill(skills) {
    return _.reduce(skills, function (curr, rank, skill) {
        console.log('getPeakSkill() reduce iterator.  curr, rank, skill: ', curr, rank, skill);
        if (rank > curr.rank) {
            curr.skill = skill.toLowerCase();
            curr.rank = rank;
        }
        return curr;
    }, {skill: '', rank: -99});
}

/**
 * dump JSON representation of character to chat
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function dump(bot, msg, parsed) {
	var guild_id = getGuildId(msg);
	console.log('guild_id: ', guild_id);
	getCharForUser(msg.author.id, guild_id)
		.then(function (char) {
            msg.reply(JSON.stringify(char.getData()));
		})
		.catch(function (err) {
            msg.reply(err);
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
		var guild_id = getGuildId(msg);
		var chardata = JSON.parse(parsed.rest_of_message());
		console.log('loadCharFromChat() chardata: ', chardata);
		if (chardata) {
			return Charsheet.loadByPlayerAndGuild(user_id, guild_id)
				.then(function (char) {
					if (char) {
						console.log('loadCharFromChat() found char record in database: char: ', char);
						// awkward!
						// already exists in database
						delete chardata.id;
						delete chardata._id;
						delete chardata.player_id;
						delete chardata.guild_id;
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
						char.guild_id = guild_id;
						console.log('loadCharFromChat() updated, unsaved char: ', char);
					} else {
						// new record
						console.log('loadCharFromChat() no existing record in database.');
						delete chardata.id;
						chardata.player_id = user_id;
						chardata.guild_id = guild_id;
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
	console.log('load_other() msg.mentions.users.size: ', msg.mentions.users.size);
	console.log('load_other() msg.mentions.users.first(): ', msg.mentions.users.first());
	if (msg.mentions.users.size) {
		var load_other = msg.mentions.users.first();
		parsed.tokens.shift(); // drop the mention string from the msg
		console.log('load_other() parsed.rest_of_message()', parsed.rest_of_message());
		console.log('load_other() load_other: ', load_other);
		return loadCharFromChat(bot, msg, parsed, load_other.id);
	}
}

