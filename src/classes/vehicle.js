var Class = require('./class');
var Event = require('./event');
var Vehicle = Class("Vehicle", ["route", "code"], function () {
	this.addRelation({
		singular: 'event',
		sort: Event.sortByTime
	});
});

Vehicle.prototype.getLink = function getLink() {

	// Ghost vehicles don't have links
	if (this.getField('ghost')) return "";
	var link = "/vehicle";
	link += "/"+this.getRoute().getNetwork().getCode();
	if (this.getRoute().getCode()) link += "/"+this.getRoute().getCode();
	link += "/"+this.getCode();
	return link;
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