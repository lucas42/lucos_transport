var Thing = require('./thing');
var Pubsub = require('lucos_pubsub');
var Route = require('./route');
function Event(vehicle, platform, datetime) {
	var id = [vehicle.getId(), platform.getId()];
	Thing.call(this, id);
	platform.addEvent(this);
	vehicle.addEvent(this);
	this.getVehicle = function getVehicle() {
		return vehicle;
	}
	this.getPlatform = function getPlatform() {
		return platform;
	}
	var thisevent = this;
	Pubsub.listen('updateTimes', function () {
		thisevent.updateRelTime();
	});
	thisevent.updateRelTime();
}
Thing.extend(Event);
Event.prototype.getData = function getData(source) {
	var output = this.getRawData();
	output.secondsTo = Math.floor((output.time - new Date()) / 1000);
	if (output.secondsTo < -5) output.passed = true;
	else if (output.secondsTo < 0) output.now = true;
	if (source == "platform") {
		var vehicledata = this.getVehicle().getData();
		for (var i in vehicledata) output[i] = vehicledata[i];
	}
	if (source == "vehicle") {
		output["platform"] = this.getPlatform().getData();
		output["stop"] = this.getPlatform().getStop().getData();

		if (output["humanReadableTime"] == "missed it") output["humanReadableTime"] = "passed it";

		var routes = Route.getByStop(this.getPlatform().getStop());
		var thisevent = this;
		var interchanges = [];
		routes.forEach(function (route) {
			if (route == thisevent.getPlatform().getRoute()) return;
			interchanges.push(route.getData());
		});

		if (interchanges.length > 0) {
			output['isinterchange'] = true;
			output['interchanges'] = interchanges;
		}
	}
	return output;
}
Event.prototype.isTerminus = function isTerminus() {
	var destination = this.getVehicle().getField("destination");
	var stopname = this.getPlatform().getStop().getField("name");
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
		.replace(" Street ", " St ");
	}
	a = normalise(a);
	b = normalise(b);
	if (a.indexOf(b) > -1) return true;
	if (b.indexOf(a) > -1) return true;
	return false;
}

/**
 * Gets the amount of time until an event in a form which is useful to humans
 */
function getHumanReadableRelTime(secondsTo) {
	if (secondsTo < -10) {
		return "missed it";
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
Event.prototype.updateRelTime = function updateRelTime() {
	var secondsTo = (this.getField('time') - new Date()) / 1000;
	var oldSecondsTo = this.getField('secondsTo');
	this.setField('secondsTo', secondsTo);
	this.setField('humanReadableTime', getHumanReadableRelTime(secondsTo));

	// TODO: tidy up event object (this) if it's been gone for 30 seconds
	this.setField('passed', secondsTo < -30);
	if (oldSecondsTo >= 1 && secondsTo < 1) {
		Pubsub.send("stopArrived", this);
	} else if (oldSecondsTo >= 30 && secondsTo < 30) {
		Pubsub.send("stopApproaching", this);
	}
}
Event.sortByTime = function sortByTime(a, b) {
	return a.getField('time') - b.getField('time');
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