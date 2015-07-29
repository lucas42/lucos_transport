Thing = require('./thing');
function Event(vehicle, platform, datetime) {
	var id = ['vehicleid', platform.getId(), datetime];
	Thing.call(this, id);
}
Thing.extend(Event);
module.exports = Event;