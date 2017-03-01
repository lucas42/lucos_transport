var Class = require('./class');
var Event = require('./event');
var Stop = require('./stop');
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
	link += "/"+encodeURIComponent(this.getRoute().getNetwork().getCode());
	if (this.getRoute().getCode()) link += "/"+encodeURIComponent(this.getRoute().getCode());
	link += "/"+encodeURIComponent(this.getCode());
	return link;
}
Vehicle.prototype.getCssClass = function getCssClass() {
	var cssclass = this.getRoute().getCssClass();
	var name = this.getField('name')
	if (name) {
		cssclass += " vehicle_"+name.toLowerCase().replace(' ', '');
	}
	return cssclass;
}
Vehicle.prototype.getSimpleDestination = function getSimpleDestination() {
	return Stop.simplifyName(this.getField("destination"));
}
Vehicle.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	output.cssClass = this.getCssClass();
	output.continues = false;
	output.routeName = this.getRoute().getQualifiedName();
	output.simpleDestination = this.getSimpleDestination();
	var events = this.getEvents();
	if (events.length) {
		output.continues = !(events[events.length-1].isTerminus());
	}
	if (output.name) {
		output.title = output.name + " (" + this.getRoute().getField("name") + ")";
	} else {
		output.title = this.getRoute().getQualifiedName() + " " + this.getCode();
	}
	return output;
}
Vehicle.prototype.refresh = function refresh(callback) {
	this.getRoute().attemptRefresh(callback);
}
module.exports = Vehicle;