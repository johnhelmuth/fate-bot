/**
 * Created by jhelmuth on 6/19/16.
 *
 * Manage the configuration of the Fatebot
 *
 * exports a config function that can be used to pull keys from the configuration
 *
 * reads from prod.json and develop.json in the same directory to get the configuration
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
		console.log('filename: ', filename);
		var load_cfg = require(filename);
		console.log('load_cfg: ', load_cfg);
		_.merge(cfg, load_cfg);
	} catch (e) {
		console.log('error loading ' + filename + ': ', e);
	}
	return cfg;
}