var Class = require('./class');
var Stop = require('./stop');
var Route = Class("Route", ["network", "code"], function () {
	this.addRelation({
		singular: 'stop',
		sort: Stop.sort,
	});
	this.addRelation('vehicle');

	// Defaut to using the code as the name
	this.setField('name', this.getCode());
	this.setField('title', this.getCode());
});
Route.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	output.cssClass = this.getCssClass();
	output.network = this.getNetwork().getCode();
	output.symbol = this.getNetwork().getSymbol();
	output.code = this.getCode();
	return output;
}
Route.prototype.getLink = function getLink() {
	return "/route/"+encodeURIComponent(this.getNetwork().getCode())+"/"+encodeURIComponent(this.getCode());
}
Route.prototype.getCssClass = function getCssClass() {
	var cssClass, code = this.getCode();
	if (code) cssClass = "route_"+code;
	else cssClass = "";
	cssClass += " "+this.getNetwork().getCssClass();
	return cssClass;
}
Route.prototype.getQualifiedName = function getQualifiedName() {
	var name = this.getField("title") || "";
	var network = this.getNetwork().getCode();
	if (network == "tube") {
		name += " Line";
	}
	if (network == "river-bus" && name.match(/^RB\d/)) {
		name = "Thames Clipper " + name;
	}
	return name;
}
Route.getByStop = function getByStop(stop) {
	return Route.getByRelatedThing('stop', stop).sort(Route.sort);
}
Route.sort = function sortRoutes(a, b) {
	var neta = a.getNetwork().getCode();
	var netb = b.getNetwork().getCode();

	// Make sure all the tube lines go at the top
	if (neta != netb) {
		if (neta == 'tube') return -1;
		if (netb == 'tube') return 1;
		if (neta == 'dlr') return -1;
		if (netb == 'dlr') return 1;
		if (neta == 'overground') return -1;
		if (netb == 'overgound') return 1;
	}
	return a.getField("title") > b.getField("title") ? 1 : -1;
}
Route.getAllData = function () {
	var routedata = [];
	var routes = Route.getAll().sort(Route.sort);
	for (var i in routes) {
		routedata.push(routes[i].getData());
	}
	return routedata;
}
Route.getOldestUpdateTime = function () {
	var oldest = null;
	Route.getAll().forEach(function (route) {
		var lastUpdated = new Date(route.getField("lastUpdated"));
		if (!oldest || lastUpdated < oldest) {
			oldest = lastUpdated;
		}
	});
	return oldest;
}
module.exports = Route;