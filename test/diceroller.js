/**
 * Created by jhelmuth on 6/18/16.
 */

const expect = require('chai').expect;
const Diceroller = require('../src/libs/diceroller');

// Bell curve for 2d6
const craps_curve = new Map([
  [2, 0.0278],
  [3, 0.0556],
  [4, 0.0833],
  [5, 0.1111],
  [6, 0.1389],
  [7, 0.1667],
  [8, 0.1389],
  [9, 0.1111],
  [10, 0.0833],
  [11, 0.0556],
  [12, 0.0278]
]);

// Bell curve for 3d6
const dndstats_curve = new Map([
  [3, 0.0046],
  [4, 0.0139],
  [5, 0.0278],
  [6, 0.0463],
  [7, 0.0694],
  [8, 0.0972],
  [9, 0.1157],
  [10, 0.1250],
  [11, 0.1250],
  [12, 0.1157],
  [13, 0.0972],
  [14, 0.0694],
  [15, 0.0463],
  [16, 0.0278],
  [17, 0.0139],
  [18, 0.0046],
]);

// Linear curve for 1d20
const dndsave_curve = new Map();
for (let res = 1; res <= 20; res++) {
  dndsave_curve.set(res, 0.05);
}

// Bell curve for 4df
const fate_curve = new Map([
  [4, 0.01230],
  [3, 0.04940],
  [2, 0.12350],
  [1, 0.19750],
  [0, 0.23460],
  [-1, 0.19750],
  [-2, 0.12350],
  [-3, 0.04940],
  [-4, 0.01230]
]);

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

		it('should not throw an error when a valid dice expression "" is passed to the constructor', function() {
		  expect(() => {
		    new Diceroller('');
      }).to.not.throw(Error);
    });

		it('should use 2d6 when called with no spec.', function () {
			testRolls(new Diceroller(), 2, 12);
		});

		it('should parse the valid dice expression "4df+5 Attack the elf" correctly', function() {
      const roller = new Diceroller('4df+5 Attack the elf');
      expect(roller.parsed.num_dice).to.equal(4);
      expect(roller.parsed.die_type).to.equal('f');
      expect(roller.parsed.bonus).to.equal(5);
      expect(roller.parsed.description).to.equal('Attack the elf');
    });

    it('should parse the valid dice expression "+5 Attack the elf" correctly', function() {
      const roller = new Diceroller('+5 Attack the elf');
      expect(roller.parsed.num_dice).to.equal(2);
      expect(roller.parsed.die_type).to.equal(6);
      expect(roller.parsed.bonus).to.equal(5);
      expect(roller.parsed.description).to.equal('Attack the elf');
    });

    it('should parse the valid dice expression "Attack the elf" correctly', function() {
      const roller = new Diceroller('Attack the elf');
      expect(roller.parsed.num_dice).to.equal(2);
      expect(roller.parsed.die_type).to.equal(6);
      expect(roller.parsed.bonus).to.equal(0);
      expect(roller.parsed.description).to.equal('Attack the elf');
    });

    it('should parse the valid dice expression "Attack the elf" correctly', function() {
      const roller = new Diceroller('Attack the elf');
      expect(roller.parsed.num_dice).to.equal(2);
      expect(roller.parsed.die_type).to.equal(6);
      expect(roller.parsed.bonus).to.equal(0);
      expect(roller.parsed.description).to.equal('Attack the elf');
    });
	});

	describe('#setDefaultDice', function () {
		it('should set the default dice spec to use to roll.', function () {
			Diceroller.setDefaultDice('4df');
			testRolls(new Diceroller(), -4, 4);
		});

    it('should parse the valid empty dice expression "" correctly', function() {
      const roller = new Diceroller('');
      expect(roller.parsed.num_dice).to.equal(4);
      expect(roller.parsed.die_type).to.equal('f');
      expect(roller.parsed.bonus).to.equal(0);
      expect(roller.parsed.description).to.equal('');
    });

    it('should parse the valid dice expression "+5 Attack the elf" correctly', function() {
      const roller = new Diceroller('+5 Attack the elf');
      expect(roller.parsed.num_dice).to.equal(4);
      expect(roller.parsed.die_type).to.equal('f');
      expect(roller.parsed.bonus).to.equal(5);
      expect(roller.parsed.description).to.equal('Attack the elf');
    });

    it('should parse the valid dice expression "Attack the elf" correctly', function() {
      const roller = new Diceroller('Attack the elf');
      expect(roller.parsed.num_dice).to.equal(4);
      expect(roller.parsed.die_type).to.equal('f');
      expect(roller.parsed.bonus).to.equal(0);
      expect(roller.parsed.description).to.equal('Attack the elf');
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

		it('each result should happen in a bell-shaped curve when 3d6 are rolled 50,000 times', function () {
      testRollResultPercentages('3d6', 3, 18, dndstats_curve, 0.01, 50000);
		});

		it('each result should happen in a bell-shaped curve when 2d6 are rolled 50,000 times', function () {
      testRollResultPercentages('2d6', 2, 12, craps_curve, 0.01, 50000);
		});

		it('each result should happen in a bell-shaped curve when 4df are rolled 50,000 times', function () {
      testRollResultPercentages('4df', -4, 4, fate_curve, 0.01, 50000);
		});

		it('each result should happen about the same amount of time when 1d20 is rolled 50,000 times', function () {
		  testRollResultPercentages('1d20', 1, 20, dndsave_curve, 0.01, 50000);
		});
	});

});

function testRolls(roller, min, max) {
	for (let i = 0; i < 100; i++) {
		expect(roller.roll().sum).to.be.above(min - 1).and.below(max + 1);
	}
}

function initResults(min, max) {
	const results = {};
	for (let r = min; r <= max; r++) {
		results[r] = 0;
	}
	return results;
}

function rollABunchPercentages(dice_spec, min, max, precision, count) {
  const results = initResults(min, max);
  let c = count;
  while (c--) {
    const roller = new Diceroller(dice_spec);
    const res = roller.roll().sum;
    results[res]++;
  }
  const res_map = new Map();
  for (let res = min; res <= max; res++) {
    const percentage = results[res] / count;
    res_map.set(res, percentage);
  }
  return res_map;
}
function testRollResultPercentages(dice_spec, min, max, percentages, threshold, c) {
  const res_map = rollABunchPercentages(dice_spec, min, max, 5, c);
  for (const [res, percentage]  of res_map) {
    expect(percentage).to.be.closeTo(percentages.get(res), threshold);
  }
}
