# FateBot

This is a bot app to help with playing Fate Role Playing Games (http://www.evilhat.com) using the Discord chat application.

### Features

 * _Dice roller_.  Fudge dice by default, but supports other simple dice specifications.

## Requirements
 * Node.js.  I'm running it on v14.16.0, not sure if it will run on other versions at this time, but, it's not really
   doing anything special, so it will probably work?

## Installation

After cloning the repo from github, configure your connection details by either:
  * Copy `src/config/prod.dist.json` to `src/config/prod.json` and edit with your Discord connection details.
  * Set the environment variables `DISCORD_CLIENT_ID`, and `DISCORD_CLIENT_SECRET` and `DISCORD_BOT_TOKEN` for the
    Discord bot connection credentials.

`src/config/prod.json` also has a couple of diceroller configurations which can be used to tune how this thing works.

Run `npm install` to install the dependencies.

Run `npm start` to start the bot.

It should connect to Discord and display (among other things) the bot OAUTH2 URL you can
use to invite the bot to your server/guild.  Login to https://discordapp.com as yourself and then open OAUTH2 URL, walk
through the process presented to allow the bot to connect to one of your servers.

The URL looks like `https://discordapp.com/oauth2/authorize?client_id=9999999999999999&scope=bot&permissions=2048`.



