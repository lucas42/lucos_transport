var Class = require('./class');
var Event = require('./event');
var Route = require('./route');
var Platform = Class("Platform", ["stop", "name"], function () {
	this.addRelation({
		singular: 'event',
		sort: Event.sortByTime,
	});
	this.addRelation({
		singular: 'route',
		sort: Route.sort,
		nofollow: true,
	});
	this.getStop().addPlatform(this);
});


Platform.prototype.getLink = function getLink() {
	return this.getStop().getLink();
}
Platform.prototype.getCssClass = function getCssClass() {
	var cssClass = "route";
	this.getRoutes().forEach(function (route) {
		cssClass += "_"+route.getNormalisedName();
	});
	return cssClass;
}
Platform.prototype.getData = function getData() {
	var output = this.getRawData();
	output.name = this.getName();
	output.title = output.name;
	output.link = this.getLink();
	output.cssClass = this.getCssClass();
	return output;
}
Platform.prototype.getInterchanges = function getInterchanges(vehicle) {
	var platform = this;

	var interchanges = [];
	var gotinterchanges = {};

	// Ignore whichever route the vehicle is on.
	gotinterchanges[vehicle.getRoute().getIndex()] = true;

	// Add any interchanges to other routes on the same network in this station
	var routes = Route.getByStop(this.getStop());
	routes.forEach(function (route) {
		if (route.getIndex() in gotinterchanges) return;
		interchanges.push(route.getData());
		gotinterchanges[route.getIndex()] = true;
	});

	// Get interchanges to stops on other networks and Out of Station Interchanges
	var externalInterchanges = this.getStop().getExternalInterchanges();
	externalInterchanges.forEach(function (stop) {
		var routes = Route.getByStop(stop);
		routes.forEach(function (route) {
			if (route.getIndex() in gotinterchanges) return;
			var routedata = route.getData();
			delete routedata['name'];
			interchanges.push(routedata);
			gotinterchanges[route.getIndex()] = true;
		});
	});

	return interchanges;
}
module.exports = Platform;