Thing = require('./thing');
function Vehicle() {
	Thing.apply(this, arguments);
	this.addRelation('event', 'events', 'vehicle');
}
Thing.extend(Vehicle);

Vehicle.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/vehicle/"+this.getId();
	output.cssClass = output.route.getCssClass();
	output.continues = false;
	var events = this.getEvents();
	if (events.length) {
		output.continues = !(events[events.length-1].isTerminus());
	}
	return output;
}
module.exports = Vehicle;