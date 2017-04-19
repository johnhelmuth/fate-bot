/**
 * Created by jhelmuth on 7/3/16.
 *
 * Fatebot commands dealing with rolling dice, independent of the Charsheet.
 *
 */

// model classes
var Diceroller = require('../diceroller');
var BotAvatar = require('../bot_avatar').avatarImages;
var _ = require('lodash');

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
};

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
        var roller = new Diceroller(diespec).roll();
        return replyWithRoll(bot, msg, roller);
        // setBotAvatarToRoll(bot, roller)
        //     .then(function () {
        //         return replyWithRoll(bot, msg, roller);
        //     })
        //     .then(function () {
        //         return setAvatar(bot, 'default');
        //     })
        //     .catch(function (err) {
        //         console.log('Error setting bot avatar: ', err);
        //         throw err;
        //     });
    } catch (e) {
        msg.reply("Error: " + e.message);
    }
}

/**
 * Set the bot avatar to match the roll result.
 *
 * @param {Client} bot
 * @param {Diceroller} roller
 * @returns {Promise}
 */
function setBotAvatarToRoll(bot, roller) {
    console.log('setBotAvatar() roller: ', roller);
    console.log('setBotAvatar() BotAvatar: ', BotAvatar);
    if (!_.isNull(BotAvatar)) {
        var rolls_name;
        if (roller.parsed.die_type == 'f') {
            rolls_name = fudgeDiceRollToName(roller);
            console.log('setBotAvatar() rolls, rolls_name: ', roller.rolls, rolls_name);
        } else {
            rolls_name = 'default';
        }
        return setAvatar(bot, rolls_name);
    }
    console.log('No bot avatar images available');
    return Promise.resolve('no_bot_avatar_images');
}

/**
 * Reply to a message with a dice roll message
 *
 * @param {Client} bot
 * @param {Message} msg
 * @param {Diceroller} roller
 *
 * @returns {Promise}
 */
function replyWithRoll(bot, msg, roller) {
    console.log('replyWithRoll() called roller: ', roller);
    return msg.reply(' rolled ' + roller.toString());
}

/**
 * Set the bot avatar to the named image
 *
 * @param {Client} bot
 * @param {String} avatar_name
 * @returns {Promise}
 */
function setAvatar(bot, avatar_name) {
    var avatarData = BotAvatar.get(avatar_name);
    if (avatarData) {
        return bot.user.setAvatar(avatarData);
    }
    console.log('Couldn\'t find name ', avatar_name);
    return Promise.resolve('no_matching_avatar_image');
}

var fudgeDiceMap = {
    '-1': '-',
    '0': '0',
    '1': '+'
};

/**
 * Convert a dice roll to an image name for the bot avatar
 *
 * @param {Diceroller} roller
 * @returns {string}
 */
function fudgeDiceRollToName(roller) {
    return roller.rolls.map(function (val) {
        if (fudgeDiceMap.hasOwnProperty(val)) {
            return fudgeDiceMap[val];
        }
        throw new Error("Invalid roll value " + val + " for fudge dice.");
    }).join('');
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
            msg.reply('Default Dice set to ' + new_dice_spec);
        } else {
            msg.reply('Default Dice not changed, there was an error parsing the dice specification.');
        }
    } else {
        msg.reply('No dice specification found in message.');
    }
}