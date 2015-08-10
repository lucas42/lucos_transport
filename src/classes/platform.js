Thing = require('./thing');
Event = require('./event');
Route = require('./route');
function Platform(stop, name, route) {
	Thing.call(this, [stop.getId(), name]);
	this.addRelation({
		singular: 'event',
		source: 'platform',
		sort: Event.sortByTime
	});
	stop.addPlatform(this);
	var cssClass;

	// TODO handle platforms which serve multiple routes
	if (route) cssClass = route.getCssClass();
	this.setData({
		name: name,
		cssClass: cssClass,
		link: stop.getLink(),
	})
	this.getStop = function getStop() {
		return stop;
	}
	this.getRoute = function getRoute() {
		return route;
	}
}

Platform.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/stop/"+this.getId();
	return output;
}
Thing.extend(Platform);
Platform.prototype.getInterchanges = function getInterchanges() {
	var platform = this;

	// Get interchanges to stops on other networks and Out of Station Interchanges
	var externalInterchanges = this.getStop().getExternalInterchanges();
	var interchanges = []
	externalInterchanges.forEach(function (stop) {
		var routes = Route.getByStop(stop);
		routes.forEach(function (route) {
			interchanges.push(route.getData());
		});
	});

	// Add any interchanges to other routes on the same network in this station
	var routes = Route.getByStop(this.getStop());
	routes.forEach(function (route) {
		if (route == platform.getRoute()) return;
		interchanges.push(route.getData());
	});
	return interchanges;
}
module.exports = Platform;