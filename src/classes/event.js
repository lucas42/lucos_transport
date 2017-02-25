var Class = require('./class');
var Pubsub = require('lucos_pubsub');
var Route = require('./route');
var Event = Class("Event", ["vehicle", "platform"], function () {

	var thisevent = this;
	var eventupdates = function eventupdates() {
		thisevent.updateRelTime();
	};
	Pubsub.listen('updateTimes', eventupdates);
	thisevent.tidyup = function tidyup() {
		Pubsub.unlisten('updateTimes', eventupdates);
		Pubsub.send("eventRemoved", thisevent);
	};
	thisevent.updateRelTime();
});

Event.prototype.getData = function getData(source) {
	var output = this.getRawData();
	output.humanReadableTime = getHumanReadableRelTime(output.secondsTo, source);
	output.source = source;
	if (source == "Platform") {
		var vehicledata = this.getVehicle().getData();
		for (var i in vehicledata) output[i] = vehicledata[i];
	}
	if (source == "Vehicle") {
		output["platform"] = this.getPlatform().getData();
		output["stop"] = this.getPlatform().getStop().getData();


		var interchanges = this.getInterchanges();

		var displayednetworks = {};

		// Find where the symbol needs no extra text
		output['symbols'] = [];
		interchanges.forEach(function (interchange) {

			// If the stop being interchanged with is the same as the current one,
			// then disregard its name.
			if (interchange['stopname'] && stationsMatch(interchange['stopname'], output['stop']['simpleName'])) {
				delete interchange['stopname'];
			}

			// For links to other networks in the same station which have a symbol,
			// just display the symbol and don't differentiate routes
			if (interchange['symbol']  && interchange['external'] && !interchange['stopname']) {
				if (!(interchange['network'] in displayednetworks)) {
					output['symbols'].push({
						src: interchange['symbol'],
						alt: interchange['network'],
					});
					displayednetworks[interchange['network']] = true;
				}
				interchange['ignore'] = true;
			}

			// If an interchange is to a different station and the network has a symbol
			// then give prominance to the station name.
			if (interchange['symbol'] && interchange['stopname']) {
				interchange['title'] = interchange['stopname'];
				delete interchange['stopname'];
			}
		});
		if (interchanges.length > 0) {
			output['isinterchange'] = true;
			output['interchanges'] = interchanges;
		}
	}
	return output;
}
Event.prototype.isTerminus = function isTerminus() {
	var destination = this.getVehicle().getSimpleDestination();
	var stopname = this.getPlatform().getStop().getSimpleName();
	return stationsMatch(stopname, destination);
}

/*
 * Takes 2 station names and tries to work out if they might be the same
 *(Obviously this is really rough and station codes should be used where possible)
 */
function stationsMatch(a, b) {
	function normalise(stationname) {
		return stationname.replace(/via .*/, '')
		.replace(/[\+\&]/, "and")
		.replace(" Street ", " St ")
		.replace("'", "")
		.replace(/\(.*\)/, '')
		.replace(/\s*$/, '')
		.replace(/^\s*/, '');
	}
	if (!a || !b) return false;
	a = normalise(a);
	b = normalise(b);
	if (a.indexOf(b) > -1) return true;
	if (b.indexOf(a) > -1) return true;
	return false;
}

/**
 * Gets the amount of time until an event in a form which is useful to humans
 */
function getHumanReadableRelTime(secondsTo, source) {
	if (secondsTo < -10) {

		// For events in the past, vary language based on perspective
		if (source == "Vehicle") {
			return "passed it";
		} else {
			return "missed it";
		}
	} else if (secondsTo < 1) {
		return "now";
	} else if (secondsTo < 60) {
		return Math.floor(secondsTo) + " secs";
	} else {
		var minsTo = Math.floor(secondsTo / 60);
		var remainSecondsTo = Math.floor(secondsTo % 60);
		if (remainSecondsTo < 10) remainSecondsTo = ":0" + remainSecondsTo;
		else remainSecondsTo = ":" + remainSecondsTo;
		return minsTo + remainSecondsTo + " mins";
	}
}


Event.prototype.getInterchanges = function getInterchanges() {
	var vehicle = this.getVehicle();
	var thisstop = this.getPlatform().getStop();

	var interchanges = [];
	var gotinterchanges = {};

	// Ignore whichever route the vehicle is on.
	gotinterchanges[vehicle.getRoute().getIndex()] = true;

	// Add any interchanges to other routes on the same network in this station
	var routes = Route.getByStop(thisstop);
	routes.forEach(function (route) {
		if (route.getIndex() in gotinterchanges) return;
		interchanges.push(route.getData());
		gotinterchanges[route.getIndex()] = true;
	});

	// Get interchanges to stops on other networks and Out of Station Interchanges
	var externalInterchanges = thisstop.getExternalInterchanges();
	externalInterchanges.forEach(function (stop) {
		var routes = Route.getByStop(stop);
		routes.forEach(function (route) {
			if (route.getIndex() in gotinterchanges) return;
			var routedata = route.getData();
			routedata['external'] = true;
			routedata['stopname'] = stop.getSimpleName();
			interchanges.push(routedata);
			gotinterchanges[route.getIndex()] = true;
		});
	});

	return interchanges;
}

Event.prototype.updateRelTime = function updateRelTime() {
	var secondsTo = (new Date(this.getField('time')) - new Date()) / 1000;
	var oldSecondsTo = this.getField('secondsTo');
	this.setField('secondsTo', secondsTo);
	this.setField('passed', secondsTo < -30);
	if (oldSecondsTo >= 1 && secondsTo < 1) {
		Pubsub.send("eventArrived", this);
	} else if (oldSecondsTo >= 30 && secondsTo < 30) {
		Pubsub.send("eventApproaching", this);
	}

	// Events which happened more than half a minute ago are irrelevant.
	if (secondsTo < -30) {
		this.deleteSelf();
	}
	Pubsub.send('updateEventTime', this);
}
Event.sortByTime = function sortByTime(a, b) {
	return new Date(a.getField('time')) - new Date(b.getField('time'));
}

var timestimeout;
/**
 * Keep all times update-to-date (once a second)
 */
function updateTimes() {
	if (timestimeout) clearTimeout(timestimeout);
	Pubsub.send("updateTimes");

	// TODO: use lucos_time for current time
	timestimeout=setTimeout(updateTimes, 1000-(new Date().getMilliseconds()));
}
updateTimes();
module.exports = Event;