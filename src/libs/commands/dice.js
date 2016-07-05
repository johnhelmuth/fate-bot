/**
 * Created by jhelmuth on 7/3/16.
 *
 * Fatebot commands dealing with rolling dice, independent of the Charsheet.
 *
 */

// model classes
var Diceroller = require('../diceroller');
var Discord = require("discord.js");

// list of commands for the bot to use
// key=what the user types, value=object with "func", "roles", and "describe" keys,
// used for the function to run, the Discord "roles" the user must have to run the command,
// and what text to display when the user types !help
module.exports = {
	"roll": {
		"func": roll,
		"describe": "*!roll <dicespec> <description>* Rolls some dice and displays the result."
	},
	"set_default_dice": {
		"func": set_default_dice,
		"describe": "*!set_default_dice <dicespec>* Sets the dicespec to use when there is no dicespec on the *!roll* command."
	},
	"speak_roll": {
		/**
		 * Speak the roll results using text-to-speech
		 *
		 * @param {Client} bot
		 * @param {Message} msg
		 * @param {Object} parsed
		 */
		"func": function(bot, msg, parsed) {
			speak_roll = true;
		},
		"describe": "Have the bot speak the results of the roll."
	},

	"quiet_roll": {
		/**
		 * Do not speak the roll results using text-to-speech
		 *
		 * @param {Client} bot
		 * @param {Message} msg
		 * @param {Object} parsed
		 */
		"func": function (bot, msg, parsed) {
			speak_roll = false;
		},
		"describe": "Do not speak the results of the roll."
	}
};

var speak_roll = false;

/**
 * Roll some dice.
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function roll(bot, msg, parsed) {
	var diespec = parsed.rest_of_message();
	console.log('roll() diespec: ', diespec);
	try {
		var roller = new Diceroller(diespec);
		bot.reply(msg, ' rolled ' + roller.roll().toString());
		if (msg.channel instanceof Discord.ServerChannel && speak_roll) {
			bot.sendTTSMessage(msg.channel, 'rolled ' + roller.sumToString());
		}
	} catch (e) {
		bot.reply(msg, "Error: " + e.message);
	}
}

/**
 * Set what the default dice are
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Object} parsed
 */
function set_default_dice(bot, msg, parsed) {
	var new_dice_spec = parsed.rest_of_message().trim();
	if (new_dice_spec) {
		if (Diceroller.setDefaultDice(new_dice_spec)) {
			bot.reply(msg, 'Default Dice set to ' + new_dice_spec);
		} else {
			bot.reply(msg, 'Default Dice not changed, there was an error parsing the dice specification.');
		}
	} else {
		bot.reply(msg, 'No dice specification found in message.');
	}
}