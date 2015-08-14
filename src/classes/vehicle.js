var Class = require('./class');
var Event = require('./event');
var Vehicle = Class("Vehicle", ["route", "code"], function () {
	this.addRelation({
		singular: 'event',
		sort: Event.sortByTime
	});
});

Vehicle.prototype.getLink = function getLink() {
	return "/vehicle/"+this.getRoute().getNetwork().getCode()+"/"+this.getRoute().getCode()+"/"+this.getCode();
}
Vehicle.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	output.cssClass = this.getRoute().getCssClass();
	output.continues = false;
	var events = this.getEvents();
	if (events.length) {
		output.continues = !(events[events.length-1].isTerminus());
	}
	return output;
}
module.exports = Vehicle;