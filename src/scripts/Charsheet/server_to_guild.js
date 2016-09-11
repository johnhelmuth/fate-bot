/**
 * Created by jhelmuth on 9/10/16.
 */

var _ = require('lodash');
var db = require('../../libs/db');
var Promise = require('bluebird');

const charsheet_collection = 'fatechars';


db()
    .then(function (db) {
        console.log('Read Data--------------------------------');
        var new_chars = db.collection(charsheet_collection).find().toArray()
            .then(function (chars) {
                console.log('chars: ', chars);
                console.log('Change Data------------------------------');
                return _.map(chars, function (char) {
                    if (char.hasOwnProperty('server_id') && ! char.hasOwnProperty('guild_id')) {
                        char.guild_id = char.server_id;
                    }
                    return char;
                });
            })
            .then(function (new_chars) {
                console.log('Save Data--------------------------------');
                console.log('new_chars: ', new_chars);
                return _.map(new_chars, function(new_char) {
                    db.collection(charsheet_collection)
                        .updateOne({_id: new_char._id}, new_char, {upsert: true})
                        .then(function (resp) {
                            console.log('updateOne() returned resp: ', resp);
                            return resp;
                        })
                });
            })
            .then(function(responses) {
                console.log('Responses--------------------------------');
                console.log('responses: ', responses);
            })
            .finally(function() {
                db.close();
            });
    });
