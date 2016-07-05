/**
 * Created by jhelmuth on 6/19/16.
 */

var expect = require('chai').expect;
var should = require('chai').should();

var Charsheet = require('../src/libs/charsheet');

describe('Charsheet', function () {
	describe('#constructor', function() {
		it('should save the passed in data to the object', function() {
			var char = new Charsheet({name: 'fred'});
			expect(char.name).to.equal('fred');
		});
	});
});