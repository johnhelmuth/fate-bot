/**
 * Created by jhelmuth on 8/7/16.
 */

const Promise = require('bluebird');
const rabbit = require('../../libs/rabbit');
const uuid = require('node-uuid');

function defer() {
    var deferred = {
        resolve: null,
        reject: null,
        promise: null
    };
    deferred.promise = new Promise(function () {
        deferred.resolve = arguments[0];
        deferred.reject = arguments[1];
    });
    return deferred;
}

const channel = rabbit();
const queue = channel.then(function(ch) {
    return ch.assertQueue('', { exclusive: true})
        .then(function(qok) {
            return qok.queue;
        });
});

function handleResponse(result, corrId, ch, msg) {
    console.log('handleResponse() result: ', result);
    console.log('handleResponse() corrId: ', corrId);
    console.log('handleResponse() msg: ', msg);
    if (msg.properties.correlationId == corrId) {
        if (msg.content) {
            console.log('result from fatebot queue: ', msg.content.toString());
            result.resolve(msg.content.toString());
        } else {
            console.error('Invalid servers returned from fatebot queue. msg: ', msg);
            result.reject(new Error('Invalid value returned from fatebot queue'));
        }
        ch.cancel(corrId);
    }
}

function callBot(call_details) {
    return Promise.all([channel, queue])
        .then(function (results) {
            var ch = results[0], q = results[1];
            var corrId = uuid();
            var result = defer();
            var hs = handleResponse.bind(null, result, corrId, ch);
            ch.consume(q, hs, {noAck: true, consumerTag: corrId});
            ch.sendToQueue(
                'fatebot_rpc',
                new Buffer(JSON.stringify(call_details)),
                {correlationId: corrId, replyTo: q}
            );
            return result.promise;
        })
        .then(function (resp) {
            if (resp) {
                return JSON.parse(resp);
            }
        });
}

function getServers() {
    return callBot({func: "servers"});
}

function getServer(server_id) {
    console.log('getServer() server_id: ', server_id);
    return callBot({func: "server", id: server_id});
}

function hasUser(user_id) {
    return callBot({func: "has_user", id: user_id});
}

function getUser(user_id) {
    return callBot({func: "user", id: user_id });
}

function rollSkill(server_id, user_id, skill, description) {
    return callBot({
        func: "roll_skill",
        server_id: server_id,
        user_id: user_id,
        skill: skill,
        description: description
    });
}

module.exports = {
    getServers: getServers,
    getServer: getServer,
    hasUser: hasUser,
    getUser: getUser,
    rollSkill: rollSkill
};