/**
 * Created by jhelmuth on 6/18/16.
 */

var expect = require('chai').expect;
var should = require('chai').should();
var Diceroller = require('../src/libs/diceroller');

describe('Diceroller', function() {

	describe('#constructor', function() {

		it('should not throw an error when a valid dice expression "2d6+1" is passed to the constructor', function() {
			expect(function () {
				new Diceroller('2d6+1');
			}).to.not.throw(Error);
		});

		it('should not throw an error when a valid dice expression "2d6" is passed to the constructor', function () {
			expect(function () {
				new Diceroller('2d6');
			}).to.not.throw(Error);
		});

		it('should not throw an error when a valid dice expression "4df+4" is passed to the constructor', function () {
			expect(function () {
				new Diceroller('4df+4');
			}).to.not.throw(Error);
		});

		it('should not throw an error when a valid dice expression "5d8-4" is passed to the constructor', function () {
			expect(function () {
				new Diceroller('5d8-4');
			}).to.not.throw(Error);
		});

		it('should not throw an error when a valid dice expression "4dF" is passed to the constructor', function () {
			expect(function () {
				new Diceroller('4dF');
			}).to.not.throw(Error);
		});

		it('should use 2d6 when called with no spec.', function () {
			testRolls(new Diceroller(), 2, 12);
		});
	});

	describe('#setDefaultDice', function () {
		it('should set the default dice spec to use to roll.', function () {
			Diceroller.setDefaultDice('4df');
			testRolls(new Diceroller(), -4, 4);
		});
	});

	describe('#roll', function() {
		it('should return a number between 2 and 12 for 2d6 each time when called 100 times', function () {
			testRolls(new Diceroller('2d6'), 2, 12);
		});

		it('should return a number between 4 and 14 for 2d6+2 each time when called 100 times', function () {
			testRolls(new Diceroller('2d6+2'), 4, 14);
		});

		it('should return a number between -4 and 4 for 4df each time when called 100 times', function () {
			testRolls(new Diceroller('4df'), -4, 4);
		});

		it('should return a number between -1 and 20 for 3d8-4 each time when called 100 times', function () {
			testRolls(new Diceroller('3d8-4'), -1, 20);
		});

		it('should return a number between 3 and 18 for 3d6 each time when called 100 times', function () {
			testRolls(new Diceroller('3d6'), 3, 18);
		});

		it('each result should happen in a bell-shaped curve when 3d6 are rolled 10,000 times', function () {
			testRollsAreBell(new Diceroller('3d6'), 3, 18);
		});

		it('each result should happen in a bell-shaped curve when 2d6 are rolled 10,000 times', function () {
			testRollsAreBell(new Diceroller('2d6'), 2, 12);
		});

		it('each result should happen in a bell-shaped curve when 4df are rolled 10,000 times', function () {
			testRollsAreBell(new Diceroller('4df'), -4, 4);
		});

		it('each result should should happen about the same amount of time when 1d20 is rolled 50,000 times', function () {
			testRollsAreEven(new Diceroller('1d20'),1,20);
		});
	});

});

function testRolls(roller, min, max) {
	for (var i = 0; i < 100; i++) {
		expect(roller.roll().sum).to.be.above(min - 1).and.below(max + 1);
	}
}

function testRollsAreEven(roller, min, max) {
	var c = 50000;
	var expected_count = c / ((max - min) + 1);
	var threshold = expected_count * 0.1;

	var results = rollABunch(roller, min, max, c);

	for (r=min; r<=max; r++) {
		var diff = Math.abs(results[r] - expected_count);
		expect(diff).to.be.below(threshold);
	}
}

function initResults(min, max) {
	var results = {};
	for (var r = min; r <= max; r++) {
		results[r] = 0;
	}
	return results;
}

function rollABunch(roller, min, max, count) {
	var results = initResults(min, max);
	var c = count;
	while (c--) {
		var res = roller.roll().sum;
		results[res]++;
	}
	return results;
}

function testRollsAreBell(roller, min, max) {
	var c = 10000;
	var results = rollABunch(roller, min, max, c);

	var low_idx1, low_idx2, low_val1 = c+1, low_val2 = low_val1;
	var high_idx1, high_idx2, high_val1 = -1, high_val2 = high_val1;

	var middle_idx = (max + min) / 2;
	var int_middle_idx = Math.floor(middle_idx);
	var middle_idxes = [int_middle_idx];
	if (middle_idx != int_middle_idx) {
		middle_idxes.push(int_middle_idx+1);
	}
	var i;
	for (i = min; i <= max; i++) {
		if (results[i] > high_val1) {
			high_val1 = results[i];
			high_idx1 = i;
		}
		if (results[i] < low_val1) {
			low_val1 = results[i];
			low_idx1 = i;
		}
	}
	for (i = min; i <= max; i++) {
		if (results[i] > high_val2 && results[i] < high_val1) {
			high_val2 = results[i];
			high_idx2 = i;
		}
		if (results[i] < low_val2 && results[i] > low_val1) {
			low_val2 = results[i];
			low_idx2 = i;
		}
	}

	// bell shapped... for now, middle points are highest, end points are lowest
	expect([low_idx1, low_idx2]).to.include(min).and.to.include(max);
	for (i = 0; i < middle_idxes.length; i++) {
		expect([high_idx1, high_idx2]).to.include(middle_idxes[i]);
	}
}