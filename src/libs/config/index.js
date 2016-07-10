/**
 * Created by jhelmuth on 6/19/16.
 *
 * Manage the configuration of the Fatebot
 *
 * exports a config function that can be used to pull keys from the configuration
 *
 * reads from prod.json and develop.json in the same directory to get the configuration
 *
 * Will overwrite certain keys in the final config with environment variables:
 *   mongo.url => MONGODB_URI
 *   bot.client_id => DISCORD_CLIENT_ID
 *   bot.token => DISCORD_BOT_TOKEN
 */

var _ = require('lodash');

/**
 * The configuration, start with prod.json
 *
 * @type {Object}
 */
var cfg =
	loadConfig('prod.json', {});

/**
 * Merge in what's in develop.json
 *
 * @type {Object}
 */
cfg = loadConfig('develop.json', cfg);

cfg = validateConfig(cfg);

/**
 * Get a value from the configuration for a given key
 *
 * @param {string} key
 * @returns {*}
 */
module.exports = function config(key) {
	if (_.isEmpty(key)) {
		return cfg;
	}
	if (cfg.hasOwnProperty(key)) {
		return cfg[key];
	}
	return null;
};

/**
 *
 * @param {string} filename
 * @param {Object} cfg base configuration
 * @returns {Object} - the cfg var merged with the object in the file.
 */
function loadConfig(filename, cfg) {
	try {
		filename = './' + filename;
		var load_cfg = require(filename);
		_.merge(cfg, load_cfg);
	} catch (e) {}
	return cfg;
}

/**
 * Validate values from the configuration files plus values from the environment
 *
 * @param {Object} cfg
 *
 * @return {Object}
 */
function validateConfig(cfg) {
    cfg = validateMongo(cfg);
    cfg = validateDiscord(cfg);
    return cfg;
}

function validateMongo(cfg) {
    if (process.env.hasOwnProperty('MONGODB_URI') && process.env.MONGODB_URI) {
        (cfg.mongo || (cfg.mongo = {})).url = process.env.MONGODB_URI;
    }
    if (! cfg.hasOwnProperty('mongo') || ! cfg.mongo.hasOwnProperty('url')) {
        console.log('overwriteMongo() cfg, env: ', cfg, process.env);
        throw new Error("No mongodb url configured.");
    }
    return cfg;
}

function validateDiscord(cfg) {
    if (process.env.hasOwnProperty('DISCORD_CLIENT_ID') && process.env.DISCORD_CLIENT_ID) {
        (cfg.bot || (cfg.bot = {})).client_id = process.env.DISCORD_CLIENT_ID;
    }
    if (process.env.hasOwnProperty('DISCORD_BOT_TOKEN') && process.env.DISCORD_BOT_TOKEN) {
        (cfg.bot || (cfg.bot = {})).token = process.env.DISCORD_BOT_TOKEN;
    }
    if (!cfg.hasOwnProperty('bot')) {
        throw new Error("No bot configuration available.");
    }
    console.log('cfg: ', cfg);
    if (!cfg.bot.hasOwnProperty('client_id')) {
        throw new Error("No bot client ID configured.");
    }
    if (!cfg.bot.hasOwnProperty('token')) {
        throw new Error("No bot token configured.");
    }
    console.log('validateDiscord() final cfg: ', cfg);
    return cfg;
}