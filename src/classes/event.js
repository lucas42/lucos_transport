Thing = require('./thing');
function Event(vehicle, platform, datetime) {
	var id = ['vehicleid', platform.getId(), datetime];
	Thing.call(this, id);
	platform.addEvent(this);
}
Thing.extend(Event);
Event.prototype.getData = function getData() {
	var output = this.getRawData();
	output.SecondsTo = Math.floor((output.time - new Date()) / 1000);
	if (output.SecondsTo < -5) output.passed = true;
	else if (output.SecondsTo < 0) output.now = true;
	return output;
}
module.exports = Event;