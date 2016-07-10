/**
 * Created by jhelmuth on 7/4/16.
 */


var express = require('express');
var app = express();

var config = {
    port: process.env.hasOwnProperty('PORT') ? process.env.PORT : 3000
};

/**
 * Start the web application, with access to the discordjs bot object that is connected to Discord
 *
 * @param {Discord.Client} fatebot
 */
function start(fatebot) {

	// start the express web app
	app.get('/', function (req, res) {
		console.log('get request to /');
        var output = '<h1>Fatebot Status</h1>';
        output += '<ul>';
        fatebot.servers.forEach(function (server) {
            output += '<li title="' + server.id + '">' + server.name + '</li>';
        });
        output += '</ul>';
        res.send(output);
	});

	app.listen(config.port, function () {
		console.log('Example app listening on port ' + config.port + '!');
	});
}

/**
 * Configure the web app component
 * (Stub only for now, nothing to do here... we pull the listening port from the environment.)
 *
 * @param {Function} config
 */
function cfg(config) {

}

module.exports = {
	config: cfg,
	start: start
};
