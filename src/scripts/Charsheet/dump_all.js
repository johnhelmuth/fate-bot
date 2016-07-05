/**
 * Created by jhelmuth on 7/4/16.
 *
 * Dump all the charsheets from the database into the filesystem.
 *
 */

var Charsheet = require('../../libs/charsheet');
var config = require('../../libs/config');

var Promise = require('bluebird');
var fs = require('fs');
var jsonfile = require('jsonfile');
var _ = require('lodash');

// make these libraries use Promises.
Promise.promisifyAll(fs);
Promise.promisifyAll(jsonfile);

Charsheet.config(config);

// move data from database to filesystem
dump_all();

/**
 * Dump all char sheets in database into filesystem
 */
function dump_all() {
	Charsheet.findAll()
		.then(function (chars) {
			console.log('dump_all() chars: ', chars);
			if (!_.isEmpty(chars)) {
				_.each(chars, function (char) {
					dump_char(char);
				});
			}
		})
		.catch(function (err) {
			console.log('Error dumping character: ', err);
		});
}

function genFilename(char) {
	console.log('genFilename() char, char.id: ', char, char.id);
	return './data/' + char.id + '.json';
}

function dump_char(char) {
	var chardata = char.getData();
	var filename = genFilename(chardata);
	return jsonfile.writeFileAsync(filename, chardata)
		.then(function () {
				var resp = "Character " + char.name + " (" + char.player + ") written to file " + filename;
				console.log(resp);
			}
		)
		.catch(function (err) {
			var resp = 'Error writing ' + filename + ': ';
			console.error(resp, err);
			throw err;
		});
}
