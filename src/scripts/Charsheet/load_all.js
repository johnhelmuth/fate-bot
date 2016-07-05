/**
 * Created by jhelmuth on 7/4/16.
 *
 * Load all of the charsheets from the filesystem into the database.
 */

var Charsheet = require('../../libs/charsheet');
var config = require('../../libs/config');

var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
var jsonfile = require('jsonfile');

// make these libraries use Promises.
Promise.promisifyAll(fs);
Promise.promisifyAll(jsonfile);

Charsheet.config(config);

// move data from file system to database
load_all();

/**
 * Load all char sheets from file system to database
 */
function load_all() {
	var datapath = './data';
	fs.readdirAsync(datapath)
		.then(function (files) {
			return Promise.all(
				files.filter(function (file) {
					return file.match(/.*\.json$/);
				}).map(function (file) {
					return load_char(path.join(datapath, file));
				})
			);
		})
		.then(function (results) {
			console.log('results: ', results);
			console.log("All " + results.length + " characters loaded into the database.");
		})
		.catch(function (err) {
			console.error('Error reading from directory + ' + datapath, err);
		})
}

function load_char(filename) {
	return jsonfile.readFileAsync(filename)
		.then(function (chardata) {
			console.log('chardata from [' + filename + ']: ', chardata);
			var char = new Charsheet(chardata);
			return char.save();
		})
}
