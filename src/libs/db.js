/**
 * Created by jhelmuth on 6/19/16.
 *
 * Get the mongodb database connection object, as a Promise
 */

var mongoclient = require('mongodb').MongoClient;
var Promise = require('bluebird');

var config = require('./config');

module.exports = function db() {
	var conn_url = config('mongo').url;
	return mongoclient.connect(conn_url, {
		'promiseLibrary': Promise
	});
};
