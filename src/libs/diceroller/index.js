/**
 * Created by jhelmuth on 6/18/16.
 *
 * Diceroller - parses a dicespec and rolls dice and formats the result
 */

const Chance = require('chance');
const chance = new Chance();
const DiceFormatter = require('./formatter');

let default_spec = '2d6';
let default_parsed = {
	num_dice: 2,
	die_type: 6,
	bonus: 0,
	description: ''
};


/**
 * Parse out a string specifying the dice to roll
 *
 * @param {string} dicespec
 * @constructor
 */
function Diceroller(dicespec) {
	if (! dicespec) {
		dicespec = default_spec;
	}
	this.parsed = parseSpec(dicespec);
	this.rolls = [];
	this.sum = 0;
	if (! this.parsed) {
		throw new Error('invalid dice specification.');
	}
}

function valid_num_dice(matches) {
	let num_dice = false;
	if (!matches[1]) {
		num_dice = default_parsed.num_dice;
	} else {
		const parsed_num_dice = parseInt(matches[1], 10);
		if (parsed_num_dice == parsed_num_dice
			&& parsed_num_dice > 0
		) {
			num_dice = parsed_num_dice;
		}
	}
	return num_dice;
}

function valid_die_type(matches) {
	let die_type = false;
	if (!matches[2]) {
		die_type = default_parsed.die_type;
	} else {
		const parsed_die_type = parseInt(matches[2], 10);
		if (parsed_die_type != parsed_die_type) {
			if (matches[2].toLowerCase() == 'f') {
				die_type = matches[2].toLowerCase();
			}
		} else {
			die_type = parsed_die_type;
		}
	}
	return die_type;
}

function valid_bonus(matches) {
	let bonus = false;
	if (matches.length < 3
		|| ! matches[3]
	) {
		bonus = 0;
	} else {
		const val = parseInt(matches[3], 10);
		if (val == val) {
			bonus = val;
		}
	}
	return bonus;
}

function parseSpec(spec) {
  let parsed_dice;
	const matches = spec.match(/^(?:(?:\s*([0-9]*)d([0-9]+|f)){0,1}\s*([+-][0-9]+){0,1}){0,1}(.*)$/i);
	if (matches) {
		const num_dice = valid_num_dice(matches);
		const die_type = valid_die_type(matches);
		const bonus = valid_bonus(matches);
		const description = matches.length > 4 ? matches[4].trim() : '';
		if (num_dice && die_type && bonus !== false) {
			parsed_dice = {
				num_dice: num_dice,
				die_type: die_type,
				bonus: bonus,
				description: description
			};
		} else {
			parsed_dice = default_parsed;
			parsed_dice.description = description
		}
		return parsed_dice;
	}
	return false;
}

function roll_a_die(die_type) {
  let range = null;
	if (die_type == 'f') {
		range = {min: -1, max: 1};
	} else {
		range = {min: 1, max: die_type};
	}
	return chance.integer(range)
}

Diceroller.prototype = {
	roll: function roll() {
		const dicerolls = [];
    let sum = 0;
		for (let d = 0; d<this.parsed.num_dice; d++) {
			const dieroll = roll_a_die(this.parsed.die_type);
			sum += dieroll;
			dicerolls.push(dieroll);
		}
		this.sum = sum + this.parsed.bonus;
		this.rolls = dicerolls;
		return this;
	},
	rollsToString: function rollsToString() {
		return DiceFormatter.formatRolls(this);
	},
	sumToString: function sumToString() {
		return DiceFormatter.formatSum(this);
	},
	bonusToString: function bonusToString() {
		return DiceFormatter.formatBonus(this.parsed.bonus);
	},
	toString: function toString() {
		return DiceFormatter.format(this);
	}
};

Diceroller.setDefaultDice = function(new_spec) {
  let new_parsed;
	if (new_parsed = parseSpec(new_spec)) {
		default_spec = new_spec;
		default_parsed = new_parsed;
		return true;
	}
	return false;
};

Diceroller.getDefaultDice = function() {
	return default_spec;
};

Diceroller.config = function(cfg) {
	const config = cfg('diceroller');
	if (config.default) {
		Diceroller.setDefaultDice(config.default);
	}
};

module.exports = Diceroller;
