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
	var link = "/tfl/vehicle";
	link += "/"+encodeURIComponent(this.getCode());
	link += "?mode="+encodeURIComponent(this.getRoute().getNetwork().getCode());
	if (this.getRoute().getCode()) link += "&route="+encodeURIComponent(this.getRoute().getCode());
	
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
Vehicle.prototype.getVehicleType = function getType() {
	switch (this.getRoute().getNetwork().getCode()) {
		case "dlr":
		case "tube":
		case "tflrail":
		case "overground":
		case "national-rail":
			return "train";
		case "river-bus":
			return "boat";
		case "tram":
			return "tram";
		case "bus":
			return "bus";
		default:
			return "vehicle";
	}
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
	output.vehicleType = this.getVehicleType();
	return output;
}
Vehicle.prototype.refresh = function refresh(callback) {
	this.getRoute().attemptRefresh(callback);
}
module.exports = Vehicle;