/**
 * 
 * app.js
 * 
 * default port is 3000
 * 
 */

var express = require('express'), app = express(), server = require('http').createServer(app), path = require('path'), io = require('socket.io').listen(server), twitterstate = require('./tweetmapper.js'), port = process.argv[2] || 3000;
io.set('log level', 1);
io.sockets.on('connection', function(socket) {

	socket.on('getStates', function(searchTerm) {
		console.log('tweets search');
		twitterstate.getTweets(encodeURIComponent(searchTerm), socket);
	});
});

app.use(express.static(path.join(path.resolve(__dirname + "/public"), '')));

server.listen(port);
