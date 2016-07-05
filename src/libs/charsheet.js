/**
 * Created by jhelmuth on 6/18/16.
 *
 * Model class for stuff dealing with a Fate character sheet, including loading and saving from/to the database.
 */

var _ = require('lodash');
var db = require('./db');
var ObjectID = require('mongodb').ObjectID;

var charsheet_collection = 'fatechars';

var fate_ladder = require('./fate_ladder');

/**
 * default data for an empty character sheet.
 *
 * @type {{id: string, name: string, player: string, player_id: string, server_id: string, refresh: number, fate_points: number, aspects: {}, skills: {}, stunts: {}, consequences: {}}}
 */
var empty_data = {
	id: '',           // database id
	name: '',         // character name
	player: '',       // player name
	player_id: '',    // Discord player user id
	server_id: '',    // Discord server id
	refresh: 3,       // Regular character sheet stuff...
	fate_points: 3,
	aspects: {},
	skills: {},
	stunts: {},
	consequences: {}
};

/**
 * Display the character sheet in a skill pyramid, or an alphabetic list of skills?
 *
 * @type {boolean}
 */
var skill_pyramid_output = false;

function Charsheet(data) {
	var self = this;
	_.forEach(empty_data, function (val, key) {
		self[key] = val;
	});
	if (!_.isEmpty(data)) {
		_.forEach(data, function (val, key) {
			if (empty_data.hasOwnProperty(key)) {
				self[key] = val;
			}
		});
	}
	if (!self.hasOwnProperty('id')
		|| _.isEmpty(self.id)
	) {
		self.id = new ObjectID();
	}
}

/**
 * Return a simple anonymous object to use as a "document" in mongodb
 *
 * @returns {Object}
 */
function getData() {
	var self = this;
	console.log('Charsheet.getData() called.  self: ', self);
	var data = {};
	_.forEach(empty_data, function(val, key) {
		data[key] = self[key];
	});
	console.log('Charsheet.getData() data: ', data);
	return data;
}

/**
 * Get or Set a value for those properties that are not singletons
 * aspects, skills, stunts, consequences
 *
 * @param {String} coll - which collection property to work with
 * @param {String} name - which element of that collection
 * @param {*} value - null to get the current value, or the value to set
 * @param {String} type - if "number", convert the value to a number
 *
 * @returns {*} - the value of the element in the collection, possibly null if not set.
 */
function getOrSet(coll, name, value, type) {
	name = name.toLowerCase();
	if (_.isUndefined(value)) {
		if (coll.hasOwnProperty(name)) {
			return coll[name];
		}
		return null;
	}
	if (!! type) {
		switch (type) {
		case "number":
			var test_value = parseInt(value, 10);
			if (test_value !== test_value) {
				value = 0;
			}
			break;
		}
	}
	return (coll[name] = value);
}

Charsheet.prototype = {
	/**
	 * Get or Set an Aspect
	 *
	 * @param {String} which - which aspect to set
	 * @param {String} value - the aspect
	 * @returns {*}
	 */
	aspect: function(which, value) {
		console.log('aspect() which, value: ', which, value);
		return getOrSet(this.aspects, which, value);
	},

	/**
	 * Get or Set a skill
	 *
	 * @param {String} which - which skill to set
	 * @param {String} value - the skill
	 * @returns {*}
	 */
	skill: function(which, value) {
		return getOrSet(this.skills, which, value, "number");
	},

	/**
	 * Get or Set a stunt
	 *
	 * @param {String} which - which stunt to set
	 * @param {String} value - the stunt
	 * @returns {*}
	 */
	stunt: function(which, value) {
		return getOrSet(this.stunts, which, value);
	},

	/**
	 * Get or Set a consequence
	 *
	 * @param {String} which - which consequence to set
	 * @param {String} value - the consequence
	 * @returns {*}
	 */
	consequence: function (which, value) {
		return getOrSet(this.consequences, which, value);
	},

	/**
	 * Set a singleton property
	 *
	 * @param {String} which - which property to set
	 * @param {*} value - the value to set on the property
	 * @returns {*} - the value.
	 */
	set: function(which, value) {
		which = which.toLowerCase();
		if (this.hasOwnProperty(which)) {
			this[which] = value;
		}
		return this[which];
	},

	/**
	 * Refresh the fate_points property to the refresh property, if it is lower.
	 *
	 * @returns {Charsheet}
	 */
	refresh: function() {
		if (this.fate_points < this.refresh) {
			this.fate_points = this.refresh;
		}
		return this;
	},

	/**
	 * Compel the character, increasing the fate_points by 1
	 *
	 * @returns {Charsheet}
	 */
	compel: function() {
		this.fate_points++;
		console.log('compel() called, new fate_points: ', this.fate_points);
		return this;
	},

	/**
	 * Invoke on the character, decreasing the fate_points by 1
	 *
	 * @returns {Charsheet}
	 */
	invoke: function() {
		if (this.fate_points) {
			this.fate_points--;
		}
		return this;
	},

	/**
	 * convert the character sheet to a string, suitable for display in Discord
	 *
	 * @returns {string}
	 */
	toString: function toString() {
		var self = this;
		var output = '';
		var attribute_names = ['name', 'player', 'aspects', 'skills', 'stunts', 'consequences', 'refresh', 'fate_points'];
		var indent = ' '.repeat(4);
		attribute_names.forEach(function(attribute) {
				if (self.hasOwnProperty(attribute)) {
					var display_attribute = displayAttribute(attribute);
					var attr = self[attribute];
					output += display_attribute + ': \n';
					if (_.isEmpty(attr) // Checks if value is an empty object, collection, map, or set.
							&& !_.isString(attr)
							&& !_.isNumber(attr)
					) {
					} else if (_.isString(attr)
							|| _.isNumber(attr)
					) {
						if (!! attr) {
							output += indent + '_**' + String(attr).trim() + "**_  \n";
						}
					} else if (attr.hasOwnProperty('toString')
							&& _.isFunction(attr.toString)
					) {
						output += indent + '_**' + attr.toString() + "**_  \n";
					} else if (_.isFunction(toStringFunctions[attribute])) {
						output += toStringFunctions[attribute](attr, indent);
					} else {
						if (_.size(attr)) {
							_.each(attr, function(val, key) {
								if (!! val) {
									output += indent + displayAttribute(key) + ': _**' + val + '**_\n';
								}
							});
						}
					}
				}
			});
		return output;
	},

	/**
	 * Return a simple object with the character sheet data in it
	 *
	 * @return {Object}
	 */
	getData: getData,

	/**
	 * Save the character sheet to the database
	 */
	save: save
};

/**
 * Custom functions to format properties, used in the toString() function
 *
 * @type {Object}
 */
var toStringFunctions = {
	aspects: function aspectsToString(aspects, indent) {
		var output = '';
		if (_.size(aspects)) {
			if (aspects.hasOwnProperty('HC')) {
				output += indent + displayAttribute('HC') + ': _**' + aspects.HC + '**_\n';
			}
			if (aspects.hasOwnProperty('Trouble')) {
				output += indent + displayAttribute('Trouble') + ': _**' + aspects.Trouble + '**_\n';
			}
			_.each(aspects, function (val, key) {
				if (['HC', 'Trouble'].indexOf(key) == -1) {
					if (!!val) {
						output += indent + displayAttribute(key) + ': _**' + val + '**_\n';
					}
				}
			});
		}
		return output;
	},
	skills: function skillsToString(skills, indent) {
		var output = '';
		if (skill_pyramid_output) {
			var skills_by_rating = {};
			_.each(skills, function(val, key) {
				if (! skills_by_rating.hasOwnProperty(val)) {
					skills_by_rating[val] = [];
				}
				skills_by_rating[val].push(key);
			});
			var skill_ratings = Object.keys(skills_by_rating).sort(function(a,b) { return b-a; });
			_.each(skill_ratings, function(rating) {
				var display_rating = displayRating(rating);
				var this_indent = ' '.repeat(14-display_rating.length);
				output += indent + this_indent + display_rating + ': ';
				output += skills_by_rating[rating].map(function(skill_name) {
						return '_**' + _.capitalize(skill_name) + '**_';
					}).join(', ') + '\n';
			});
		} else {
			if (_.size(skills)) {
				var skills_by_name = Object.keys(skills).sort(function(a, b) { if (a < b) return -1; else if (a > b) return 1; else return 0; });
				console.log('skillsToString() skills_by_name: ', skills_by_name);
				_.each(skills_by_name, function (key) {
					output += indent + _.capitalize(key) + ': _**' + displayRating(skills[key]) + '**_\n';
				});
			}
		}
		return output;
	}
};

/**
 * Format an attribute name (property) for display
 *
 * @param {string} attribute_name
 * @returns {string}
 */
function displayAttribute(attribute_name) {
	return attribute_name.split('_').map(_.capitalize).join(' ');
}

/**
 * Format a rating (a numerical property value) Using the Fate Ladder
 * and an initial "-" or "+" character.  Used to display skills
 *
 * @param {integer} rating
 * @returns {string}
 */
function displayRating(rating) {
	var prefix = '', suffix = '';
	if (fate_ladder.hasOwnProperty(rating)) {
		prefix = _.capitalize(fate_ladder[rating]) + ' (';
		suffix = ')';
	}
	if (rating >= 0) {
		rating = '+' + rating;
	}
	return prefix + rating + suffix;
}

/**
 * Save the character sheet
 *
 * @returns {Promise} resolves to the character sheet object
 */
function save() {
	var self = this;
	if (_.isEmpty(this.id)) {
		return Promise.reject('No id set on character sheet.');
	}
	console.log('Top of Charsheet.save() self, self.getData(): ', self, self.getData());
	return db()
		.then(function (db) {
			var data = self.getData();
			console.log('save() data: ', data);
			if (!data.hasOwnProperty('_id') && data.hasOwnProperty('id')) {
				data._id = data.id;
				delete data.id;
			}
			console.log('save() switched id to _id? data: ', data);
			return db.collection(charsheet_collection)
				.updateOne({_id: data._id}, data, {upsert: true})
				.then(function(resp) {
					console.log('updateOne() returned resp: ', resp, '. returning this: ', self);
					return self;
				})
				.finally(function () {
					db.close();
				});
		});
}

/**
 * Given a document from the database, create the Charsheet object
 *
 * @param {Object} data_from_db
 * @returns {Charsheet|null}
 */
function createCharsheetFromDb(data_from_db) {
	if (_.isEmpty(data_from_db)) {
		return data_from_db;
	}
	console.log('Charsheet.createCharsheetFromDb() data_from_db: ', data_from_db);
	data_from_db.id = data_from_db._id;
	delete data_from_db._id;
	return new Charsheet(data_from_db);
}

/**
 * Is this property not a singleton property?
 *
 * @param {String} key
 * @returns {boolean}
 */
Charsheet.isMultiple = function isMultiple(key) {
	return ['aspect', 'skill', 'stunt', 'consequence'].indexOf(key) !== -1;
};

/**
 * Load a Charsheet from the database by charsheet_id
 *
 * @param {ObjectID|String} charsheet_id
 * @returns {Promise}
 */
Charsheet.load = function(charsheet_id) {
	if (_.isEmpty(charsheet_id)) {
		return Promise.reject('No id available to load');
	}
	return db()
		.then(function(db) {
			return db.collection(charsheet_collection).find({ _id: charsheet_id }).limit(1).next()
				.then(createCharsheetFromDb)
				.finally(function () {
					db.close();
				});
		});
};

/**
 * Load a bunch of character sheets from the database by arbitrary params
 *
 * @param {Object} params - a mongodb query expression
 *
 * @returns {Promise} that resolves to an Array of Charsheets
 */
Charsheet.loadBy = function loadBy(params) {
	if (_.isEmpty(params)) {
		return Promise.reject('No parameters to load characters.');
	}
	return db()
		.then(function(db) {
			return db.collection(charsheet_collection)
				.find(params).toArray()
				.then(function(chars_data) {
					return chars_data.map(function (chardata) {
						return createCharsheetFromDb(chardata);
					});
				})
				.finally(function() {
					db.close();
				})
		});
};

/**
 * Load the character sheet for a given user on a given server
 *
 * @param {String} user_id
 * @param {String} server_id
 * @returns {Promise} that resolves to a Charsheet
 */
Charsheet.loadByPlayerAndServer = function loadByPlayerAndServer(user_id, server_id) {
		if (_.isEmpty(user_id)) {
			return Promise.reject('No id available to load');
		}
		return db()
			.then(function (db) {
				return db.collection(charsheet_collection)
					.find({player_id: user_id, server_id: server_id}).limit(1).next()
					.then(createCharsheetFromDb)
					.finally(function () {
						db.close();
					});
			});
};

/**
 * Set the skill pyramid flag
 *
 * @param {boolean} flag
 */
Charsheet.setSkillPyramid = function(flag) {
	skill_pyramid_output = !! flag;
};

/**
 * Configure the Charsheet class
 *
 * @param {Function} cfg - used to get the charsheet configuration
 */
Charsheet.config = function(cfg) {
	var config = cfg('charsheet');
	Charsheet.setSkillPyramid(config.pyramid);
};

/**
 * Get the default value for a given attribute.
 *
 * @param {String} attr
 * @returns {*}
 */
Charsheet.getDefaultAttr = function(attr) {
	if (empty_data.hasOwnProperty(attr)) {
		return empty_data[attr];
	}
	return null;
};

Charsheet.findAll = findAll;
/**
 * Find all character sheets in the database
 *
 * @returns {Promise} that resolves to an array of Charsheet objects
 */
function findAll() {
	console.log('findAll() called.');
	return db()
		.then(function (db) {
			return db.collection(charsheet_collection).find().toArray()
				.then(function (chars_data) {
					var characters = [];
					if (!_.isEmpty(chars_data)) {
						characters = _.map(chars_data, createCharsheetFromDb);
					}
					console.log('findAll() find() Charsheet characters: ', characters);
					return characters;
				})
				.finally(function () {
					db.close();
				});
		});
}

module.exports = Charsheet;
