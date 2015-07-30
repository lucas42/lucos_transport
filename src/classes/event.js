Thing = require('./thing');
function Event(vehicle, platform, datetime) {
	var id = [vehicle.getId(), platform.getId(), datetime];
	Thing.call(this, id);
	platform.addEvent(this);
	this.getVehicle = function getVehicle() {
		return vehicle;
	}
}
Thing.extend(Event);
Event.prototype.getData = function getData(source) {
	var output = this.getRawData();
	output.SecondsTo = Math.floor((output.time - new Date()) / 1000);
	if (output.SecondsTo < -5) output.passed = true;
	else if (output.SecondsTo < 0) output.now = true;
	if (source == "platform") {
		var vehicledata = this.getVehicle().getData();
		for (var i in vehicledata) output[i] = vehicledata[i];
	}
	return output;
}
module.exports = Event;