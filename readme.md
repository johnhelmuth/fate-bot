# FateBot

This is a bot app to help with playing Fate Role Playing Games (http://www.evilhat.com) using the Discord chat application.

### Features

 * _Dice roller_.  Fudge dice by default, but supports other simple dice specifications.
 * _Fate character sheets_. One per user per server/guild.  
   * Supports standard Fate Core/FAE character attributes, Aspects, Skills/Approaches, Stunts, Consequences
 
## Requirements
 * Node.js.  I'm running it on v6.3.0, not sure if it will run more recent versions at this time, but, it's not really
   doing anything special, so it will probably work?
 * Mongodb instance. Running v3.2.3

## Installation

After cloning the repo from github, configure your connection details by either:
  * Copy `src/config/prod.dist.json` to `src/config/prod.json` and edit with your mongodb 
    and Discord connection details.
  * Set the environment variable `MONGODB_URI` for the mongodb connection URI, and `DISCORD_CLIENT_ID`
    and `DISCORD_BOT_TOKEN` for the Discord bot connection credentials.
 
`src/config/prod.json` also has a couple of diceroller and Fate character sheet configurations which can
be used to tune how this thing works.

Run `npm install` to install the dependencies.
 
Run `npm start` to start the bot.  

It should connect to Discord and display (among other things) the bot OAUTH2 URL you can
use to invite the bot to your server/guild.  Login to http://discordapp.com as yourself and then open OAUTH2 UR, walk through the
process presented to allow the bot to connect to one of your servers.

The URL looks like `https://discordapp.com/oauth2/authorize?client_id=9999999999999999&scope=bot&permissions=0`.  I don't 
remember the exact steps I used to get this to connect properly.  I've slept since then.



