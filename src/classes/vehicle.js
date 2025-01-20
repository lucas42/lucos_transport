import Class from './class.js';
import Event from './event.js';
import Stop from './stop.js';
import boatnames from '../../data/boatnames.json' with { type: "json" };
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
	link += "?mode="+encodeURIComponent(this.getRoute().getField("mode"));
	if (this.getRoute().getCode()) link += "&route="+encodeURIComponent(this.getRoute().getCode());
	
	return link;
}
Vehicle.prototype.getCssClass = function getCssClass() {
	var cssclass = this.getRoute().getCssClass();
	var name = this.getName();
	if (name) {
		cssclass += " vehicle_"+name.toLowerCase().replace(' ', '');
	}
	return cssclass;
}
Vehicle.prototype.getSimpleDestination = function getSimpleDestination() {
	return Stop.simplifyName(this.getField("destination"));
}
Vehicle.prototype.getVehicleType = function getType() {
	switch (this.getRoute().getField("mode")) {
		case "dlr":
		case "tube":
		case "elizabeth-line":
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
Vehicle.prototype.getName = function getName() {
	var code = this.getCode();
	if (code in boatnames) return boatnames[code];
	return null;
}
Vehicle.prototype.getTitle = function getName() {
	if (this.getName()) {
		return this.getName() + " (" + this.getRoute().getField("name").toUpperCase() + ")";
	}
	if (this.getVehicleType() == "bus") {
		return "Bus " + this.getCode() + " (" + this.getRoute().getField("name").toUpperCase() + ")";
	}
	return this.getRoute().getQualifiedName() + " " + (this.getField("setNo") || this.getCode());
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
	output.title = this.getTitle();
	output.vehicleType = this.getVehicleType();
	if (output.vehicleType == "bus" || output.vehicleType == "boat") {
		output.routeNumber = this.getRoute().getCode();
	}
	if (!output.destination) {
		output.simpleDestination = output.destination = `Check Front of ${output.vehicleType.charAt(0).toUpperCase()+output.vehicleType.slice(1)}`;
	}
	return output;
}
Vehicle.prototype.refresh = function refresh(callback) {
	this.getRoute().attemptRefresh(callback);
}
export default Vehicle;