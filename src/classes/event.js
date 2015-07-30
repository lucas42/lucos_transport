Thing = require('./thing');
function Event(vehicle, platform, datetime) {
	var id = [vehicle.getId(), platform.getId(), datetime];
	Thing.call(this, id);
	platform.addEvent(this);
	vehicle.addEvent(this);
	this.getVehicle = function getVehicle() {
		return vehicle;
	}
	this.getPlatform = function getPlatform() {
		return platform;
	}
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
module.exports = Event;