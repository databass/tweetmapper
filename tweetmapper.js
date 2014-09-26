/**
 * 
 * tweetmapper.js executes the Twitter API search tweets features, and returns data back to the
 * Web client via WebSockets
 * 
 */


var _ = require('underscore'), express = require('express'), app = express(), server = require('http').createServer(app), moment = require('moment'), path = require('path'), io = require('socket.io').listen(server), twitter = require('twitter'), sys = require('sys'), exec = require('child_process').exec, stateInfo = require("./states.js"), twitterCodes = require('./twitterCodes.js').getTwitterCodes(), twit = new twitter(twitterCodes);


exports.getTweets = function(searchTerm, socket) {

	var socketId = socket.id, stateSearches = stateInfo.getStates(), geocodeOrigins = [ "47.0,-122.0,400mi", "41.4822, -81.6697, 400mi", "34.0,-118.0,400mi", "40.0,-74.0,400mi", "44.4758,-73.2119,400mi", "44.4758,-98.2119,400mi", "37.75,-84.39,400mi" ], MAX_PAGES = 5, loopCount = 0, stateSummaries = {}, stateTweetText = {}, alreadyFoundTweets = {}, cancelSocket = {}, tweetTotal = {};

	io.set('log level', 1);

	stateSummaries[socketId] = [];
	stateTweetText[socketId] = [];
	alreadyFoundTweets[socketId] = [];
	tweetTotal[socketId] = 0;
	cancelSocket[socketId] = false;

	socket.on('cancelStates', function(socket) {
		console.log('cancel tweets search');
		cancelSocket[socketId] = true;
	});

	var searchTweets = function(maxId, geocodeOrigins) {
		console.log('st');

		var searchParam = {};
		if (maxId !== undefined && maxId !== null) {
			console.log("maxid is " + maxId);
			searchParam.max_id = maxId;
		}
		searchParam.granularity = "admin";
		searchParam.result_type = "recent";
		searchParam.geocode = geocodeOrigins[0];
		searchParam.count = "100";
		console.log('searching ' + searchTerm);
		twit.search(searchTerm, searchParam, function(data) {
			console.log('data is ' + JSON.stringify(data));

		var formatErrorMessage = function(errorObject) {
			var errorMessage = errorObject.message;
			var errorCode = errorObject.code;
			if (errorCode === 88) {
				errorMessage +=". Please try again in a few minutes";
			}
			return errorMessage;
			
		}


			if (data !== undefined && data.data !== undefined) {
				console.log('error');
				socket.emit('errorMessage', formatErrorMessage(JSON.parse(data['data'])['errors'][0]));

			}

			loopCount++;

			if (data.statuses !== undefined) {
				// haven't found this id already and we match a state

				_.each(data.statuses, function(status) {
					console.log(status.id);
					// console.log(JSON.stringify(status));
					var convertLink = function(text) {
						return text.replace(/(http:[^\s]+)\s*/g, '<a target="_blank" href="$1">$1<\/a> ');
					}, genProfileLink = function(screenName, userName) {
						return '<a href="https://twitter.com/' + screenName + '" target="_blank">@' + screenName + '</a>';
					}, convertTwitterDate = function(twitterDate) {
						console.log('converting ' + twitterDate);
						// convert to local string and remove seconds and year
						// //

						var date = new Date(Date.parse(twitterDate)).toLocaleString().substr(0, 16);
						// get the two digit hour //
						var hour = date.substr(-5, 2);
						// convert to AM or PM //
						var ampm = hour < 12 ? ' AM' : ' PM';
						if (hour > 12)
							hour -= 12;
						if (hour == 0)
							hour = 12;
						// return the formatted string //
						console.log('return ' + date.substr(0, 11) + ' • ' + hour + date.substr(13) + ampm);
						return date.substr(0, 11) + ' ' + hour + ':' + date.substr(13) + ampm;

					};

					var matchedState = "", totalStates = 0;
					if (!_.find(alreadyFoundTweets[socketId], function(foundTweet) {

						return foundTweet === status.id;
					}) && _.find(stateSearches, function(stateSearch) {
						matchedState = stateSearch.rs;
						return status.user.location.match(new RegExp(stateSearch.reg + "$"), 'i');
					}))

					{

						alreadyFoundTweets[socketId].push(status.id);
						console.log('pushing');
						console.log(status.created_at);
						stateTweetText[socketId].push({
							"state" : matchedState,
							"name" : status.user.name,
							"screen_name" : genProfileLink(status.user.screen_name, status.user.name),
							"location" : status.user.location,
							"date" : convertTwitterDate(status.created_at),
							"text" : convertLink(status.text),
							"image_url" : status.user.profile_image_url,

						});

						if (stateSummaries[socketId][matchedState] !== undefined) {
							stateSummaries[socketId][matchedState]++;
							stateTweetCount = stateSummaries[socketId][matchedState] + 1;
						} else {
							stateSummaries[socketId][matchedState] = 1;
						}
						totalStates = _.keys(stateSummaries[socketId]).length;
						tweetTotal[socketId]++;
						console.log("image url is " + status.user.profile_image_url);
						socket.emit('updateState', matchedState, stateSummaries[socketId][matchedState], totalStates, tweetTotal[socketId], status.user.profile_image_url, status.user.name, status.user.screen_name, status.user.location);
					}

				});

				socket.emit('tweetText', stateTweetText[socketId]);

				if (!cancelSocket[socketId] && loopCount < MAX_PAGES && data.statuses.length > 0) {
					console.log('canceled');
					searchTweets(data.statuses[data.statuses.length - 1].id, geocodeOrigins);

				} else if (!cancelSocket[socketId] && geocodeOrigins.length > 0) {

					loopCount = 0;
					searchTweets(null, geocodeOrigins.slice(1));

				} else {
					socket.emit('finished');
					stateTweetText[socketId].length = 0;
					console.log("all done");

				}

			}

		});

	};
	console.log("Starting out search");
	searchTweets(null, geocodeOrigins);

};

function tweet(data) {
	count++;
	if (typeof data === 'string')
		sys.puts(data);
	else if (data.text && data.user && data.user.screen_name)
		sys.puts('"' + data.text + '" -- ' + data.user.screen_name);
	else if (data.message)
		sys.puts('ERROR: ' + sys.inspect(data));
	else
		sys.puts(sys.inspect(data));
}


