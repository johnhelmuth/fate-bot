/**
 * Created by jhelmuth on 8/7/16.
 */

var amqp = require('amqplib');

var config = require('./config');

var conn_url = config('amqp').url;

/**
 *
 * @type {ChannelModel}
 */
var amqp_connection = amqp.connect(conn_url)
    .then(function (conn) {
        process.once('SIGINT', function () {
            conn.close().then(passInterrupt, passInterrupt);
        });
        return conn;
    });

function passInterrupt() {
    process.kill(process.pid, 'SIGINT');
}

module.exports = function rabbit() {
    return amqp_connection
        .then(function (conn) {
            return conn.createChannel();
        });
};
