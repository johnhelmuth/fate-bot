/**
 *
 * Fatebot
 *
 * Connect to discord and listen for messages for the Fatebot to handle.  And handle them.
 *
 */

const Discord = require("discord.js");
const Diceroller = require('./libs/diceroller');
const dispatchlib = require('./libs/dispatch');
const dispatch = dispatchlib.dispatch;
const config = require('./libs/config');

const fatebot = new Discord.Client();

// https://discordapp.com/developers/applications/me My Applications - Fatebot application
// src/config/*.json bot.token should be APP BOT USER / Token: value
// or use environment variables DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and DISCORD_BOT_TOKEN

const discordToken = config('bot').token;

dispatchlib.config(config);
Diceroller.config(config);

fatebot
	.on("ready", function() {
		console.log("Fatebot is ready.");
		console.log('fatebot.user.id: ', fatebot.user.id);

		// src/config/*.json bot.clientid should be configured from https://discordapp.com/developers/applications/me My Applications - Fatebot application
		// "Client/Application ID:" value
    // or use environment variable DISCORD_CLIENT_ID
		console.log('Use this URL to invite Fatebot to your server/channel: ',
			`https://discordapp.com/oauth2/authorize?client_id=${config('bot').client_id}&scope=bot&permissions=${config('bot').bot_permissions} Fatebot`
		);
	})
	.on("message", function (message) {
		if (dispatch(fatebot, message)) {
			console.log('Message dispatched.');
		}
	})
	.on("disconnected", function () {
		console.log("Fatebot Disconnected!.");
        process.exit(1); //exit node.js with an error
	})
	.login(discordToken);
