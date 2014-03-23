/**
 * tweetmapper.js
 * 
 * D3, event handlers, WebSockets--everything client-related for TweetMapper
 * 
 */

// when the document has loaded, add event-handlers
// note that all underscore templates are defined in index.html
var TM = (function() {
	var currentSearchTerm = "";
	var imageCount = 0;
	var domainRange = [ 0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200 ];
	// var colorScheme = [ "#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb",
	// "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58" ];
	// var colorScheme =
	// ['rgb(247,252,253)','rgb(224,236,244)','rgb(191,211,230)','rgb(158,188,218)','rgb(140,150,198)','rgb(140,107,177)','rgb(136,65,157)','rgb(129,15,124)','rgb(77,0,75)','rgb(44,0,44)','rgb(33,0,31)']
	var colorScheme = [ 'rgb(236,226,241)', 'rgb(218,212,235)', 'rgb(198,200,230)', 'rgb(166,189,219)', 'rgb(103,169,207)', 'rgb(54,144,192)', 'rgb(2,129,138)', 'rgb(1,108,89)', 'rgb(1,70,54)', 'rgb(1,50,33)', 'rgb(1,30,22)' ];
	var generateLegend = function() {

		var legendColorScheme = colorScheme.reverse();

		var svg = d3.select("#LegendContainer").append("svg").attr("width", 300, "height");

		// Define default colorbrewer scheme
		// Define quantile scale to sort data values into buckets of color
		var color = d3.scale.quantize().range(legendColorScheme);

		color.domain([ d3.min(domainRange, function(d) {
			return d; // just using raw numbers for data
		}), d3.max(domainRange, function(d) {
			return d;
		}) ]);

		var legend = svg.selectAll('g.legendEntry').data(color.range().reverse()).enter().append('g').attr('class', 'legendEntry');

		legend.append('rect').attr("x", 200).attr("y", function(d, i) {

			return i * 20 + 1;
		}).attr("width", 10).attr("height", 10).style("stroke", "black").style("stroke-width", 1).style("fill", function(d) {
			return d;
		});
		// the data objects are the fill colors

		legend.append('text').attr("x", 215) // leave 5 pixels

		.attr("y", function(d, i) {
			return i * 20 + 1;
		}).attr("dy", "0.8em") // place text one line *below* the x,y
		// point
		.text(function(d, i) {
			return parseInt(domainRange[i] + 10, 10) + ' tweets';

		});

	};

	return {

		"init" : function() {

			var stateTweetsHandler = function(stateId) {

				var data = {};

				stateId = stateId.substring(0, 2);
				data.tweets = _.filter(currentStateTweetText, function(tweet) {
					return tweet.state === stateId.substring(0, 2);
				});

				$('#myTweetsModal').modal({
					show : true
				});

				// workaround to make modal draggable
				$("#myTweetsModal").draggable({
					handle : ".modal-header"
				});

				$('#myTweetsModal .modal-title').html('Tweets for  <span class="bold">' + stateId + '</span><span class="searchTerm">\"' + currentSearchTerm + '\"</span>');
				$('#myTweetsModal .modal-body').html(_.template($('#TweetsTemplate').html(), data));

			}, cancelTwitterStatesHandler = function() {

				socket.emit("cancelStates");

			}, twitterSearchHandler = function() {

				currentSearchTerm = document.getElementById("SearchInput").value;
				$("#SearchStatusContainer").html('<span id="scanVerb">Scanning</span> Twittersphere for <span class="searchTerm">' + currentSearchTerm + '</span>');
				$("#CounterContainer").empty();
				$("#UserContainer").fadeOut();
				;
				$("#ClickContainer").fadeOut();
				$(".sampledImage").empty();

				imageCount = 0;

				d3.selectAll("path.state").style("fill", "#FEFEFE");
				d3.selectAll("path.state").select("title").remove();

				socket.emit("cancelStates");

				socket.emit("getStates", currentSearchTerm);

			}, socket = io.connect((function() {
				return document.URL.toString().split('/')[0] + '//' + document.URL.toString().split('/')[2];

			})());

			// TODO Bootstrap popup
			socket.on("error", function(message) {
				alert('error' + message);
				// alert(JSON.stringify(message));
			});

			// we're all done, so changed the language to the past tense
			socket.on("finished", function() {
				$("#mapVerb").html('Mapped');
				$("#scanVerb").html('Scanned');

			});

			socket.on("tweetText", function(tweetText) {

				currentStateTweetText = tweetText;
			});

			socket.on('updateState', function(state, stateTotal, totalStates, total, image_url, username, screenName, userLocation) {

				var color = d3.scale.linear().domain(domainRange).range(colorScheme), image, s = '';

				if (totalStates > 1) {
					s = 's';
				}

				if (imageCount === 0) {
					$("#UserContainer").fadeIn();
					;
				}

				if (!$("#clickContainer").is(":visible")) {
					$("#ClickContainer").fadeIn();
				}
				image = document.createElement('img');
				image.title = 'foo';

				$("<img />").attr("title", username + ' @' + screenName + ' from ' + userLocation).attr("src", image_url).load(function() {

					$("#image" + parseInt(imageCount++ % 9, 10)).html($(this).clone());

				});

				document.getElementById("CounterContainer").innerHTML = "<span id='mapVerb'>Mapping</span> <span id='tweetCounter' class='counter'>" + total + "</span> tweets in <span class='counter'>" + totalStates + "</span> state" + s;

				// document.getElementById("image" + imageCount++ % 5).innerHTML
				// = "<img src='" + image_url + "'></img>";

				currentTweetTotal = total;

				d3.select("#" + state).style("fill", color(stateTotal));

				// TODO: figure out why doesn't dynamically updated the <g>
				// tag work?
				if (state === 'MI') {
					d3.select("#MIUP").style("fill", color(stateTotal));
					d3.select("#MISP").style("fill", color(stateTotal));
				}

				d3.select("#" + state).select("title").remove();
				d3.select("#" + state).append("title").text(state + ": " + stateTotal + " tweets");

			});
			d3.selectAll("path.state").on('click', function() {
				stateTweetsHandler(this.id);
			});

			$("#SearchButton").on('click', twitterSearchHandler);

			$('#SearchInput').on('keypress', function(event) {

				var keycode = (event.keyCode ? event.keyCode : event.which);
				if (keycode === 13) {
					twitterSearchHandler();
				}
			});

			generateLegend();
		}

	};

})();
