/**
 *
 * Fatebot
 *
 * Connect to discord and listen for messages for the Fatebot to handle.  And handle them.
 *
 */

var path = require('path');

var Discord = require("discord.js");
var Diceroller = require('./libs/diceroller');
var Charsheet = require('./libs/charsheet');
var dispatchlib = require('./libs/dispatch');
var dispatch = dispatchlib.dispatch;
var config = require('./libs/config');
var bot_avatar = require('./libs/bot_avatar');
var startWebApp = require('./webapp/app');
var webApp;

var fatebot = new Discord.Client();

// https://discordapp.com/developers/applications/me My Applications - Fatebot application
// src/config/*.json bot.token should be APP BOT USER / Token: value
var discordToken = config('bot').token;

dispatchlib.config(config);
Diceroller.config(config);
Charsheet.config(config);
bot_avatar.config(config);

fatebot
	.on("ready", function() {
		console.log("Fatebot is ready.");
		console.log('fatebot.user.id: ', fatebot.user.id);

		// src/config/*.json bot.clientid should be configured from https://discordapp.com/developers/applications/me My Applications - Fatebot application
		// "Client/Application ID:" value
		console.log('Use this URL to invite Fatebot to your server/channel: ',
			"https://discordapp.com/oauth2/authorize?client_id=" + config('bot').client_id + "&scope=bot&permissions=0 FateBot"
		);

        console.log('Telling web app about fatebot');
        webApp = startWebApp(config, fatebot);
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
	.loginWithToken(discordToken);