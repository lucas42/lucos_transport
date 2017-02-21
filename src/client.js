var Event = require('./classes/event');
var Vehicle = require('./classes/vehicle');
var Route = require('./classes/route');
var Network = require('./classes/network');
var Stop = require('./classes/stop');
var Platform = require('./classes/platform');
var Pubsub = require('lucos_pubsub');


// HACK: make up stub objects because all we care about is events for now
var network = new Network('null');
var route = new Route(network,'null');
var vehicle = new Vehicle(route, 'null');
var stop = new Stop(network, 'null');
var platform = new Platform(stop, null);

function pageLoad() {
	var eventNodes = document.querySelectorAll('.departtime, .stoptime');
	for (var i=0; i < eventNodes.length; i++) {
		var eventNode = eventNodes[i];

		// HACK: just make up a new vehicle for each event on the page for now
		var event = new Event(new Vehicle(route, i), platform);
		event.setField('time', new Date(eventNode.dataset.time));
		event.setField('DOMNode', eventNode);
		event.updateRelTime();

	}
	var refreshButton = document.getElementById('refresh');
	if (refreshButton) {
		refreshButton.addEventListener('click', refresh);
		refreshButton.setAttribute('class', 'listening');
	}
}

/**
 * Refresh the client-side data
 *
 * Should only be available on pages served by service worker
 * Therefore can make http calls not understood by server
 **/
function refresh() {
	fetch('/refresh');
}

// If the page is still loading, wait till it's done to do stuff
if (Document.readyState == "loading") {
	document.addEventListener('DOMContentLoaded', pageLoad);

// If the page has already loaded, do stuff now
} else {
	pageLoad();
}

// When the event's time changes, update the DOM accordingly
Pubsub.listen('updateEventTime', function (event) {
	var eventNode = event.getField('DOMNode');
	if (!eventNode) return;
	eventNode.textContent = event.getData(eventNode.dataset.source).humanReadableTime;
});

// When an event is removed, remove it from the DOM too.
Pubsub.listen('eventRemoved', function (event) {
	var eventNode = event.getField('DOMNode');
	if (!eventNode) return;
	if (eventNode.dataset.source == "Vehicle") {
		var stop = eventNode.parentNode;
		var route = stop.parentNode;
		route.removeChild(stop);
	} else if (eventNode.dataset.source == "Platform") {
		var vehicle = eventNode.parentNode.parentNode;
		var boardlist = vehicle.parentNode;
		boardlist.removeChild(vehicle);
	}
});


(function swHelperInit() {
	var registration;
	if ('serviceWorker' in navigator) {
		registration = navigator.serviceWorker.register('/serviceworker.js');
	} else {
		registration = new Promise(function(resolve, reject) {
			throw "no service worker support";
		});
	}
	registration.then(function swRegistered(registration) {
		console.log('ServiceWorker registration successful with scope: ' + registration.scope);
		registration.update();
	}).catch(function swError(error) {
		console.error('ServiceWorker registration failed: ' + error);
	});
})();