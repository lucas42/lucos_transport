/**
 * Fetches serialised data from the server
 * for deserialising on the client
 */

function start() {
	setInterval(loadServerData, 30000);
	loadServerData();
}

const Stop = require('../classes/stop'),
Route = require('../classes/route'),
Network = require('../classes/network'),
Vehicle = require('../classes/vehicle'),
Platform = require('../classes/platform'),
Event = require('../classes/event');
function loadServerData() {
	return fetch('/data.json').then(function (response) {
		return response.json();
	}).then(function (data) {
		if (!data) {
			console.error("no data on refresh");
			return;
		}
		for (var index in data.networks) {
			var network = new Network(index);
			network.setData(data.networks[index]);
		}
		for (var index in data.stops) {
			var stopdata = data.stops[index];
			var keys = index.split(',');
			var network = new Network(keys[0]);
			var stop = new Stop(network, keys[1]);
			stop.setData(stopdata);
		}
		for (var index in data.routes) {
			var routedata = data.routes[index];
			var keys = index.split(',');
			var network = new Network(keys[0]);
			var route = new Route(network, keys[1]);
			route.setData(routedata);
			routedata.relations.stop.forEach(function (stopid) {
				route.addStop(Stop.getById(stopid));
			});
		}
		for (var index in data.vehicles) {
			var vehicledata = data.vehicles[index];
			var keys = index.split(',');
			var network = new Network(keys[0]);
			var route = new Route(network, keys[1]);
			var vehicle = new Vehicle(route, keys[2]);
			vehicle.setData(vehicledata);
		}
		for (var index in data.platforms) {
			var platformdata = data.platforms[index];
			var keys = index.split(',');
			var network = new Network(keys[0]);
			var stop = new Stop(network, keys[1]);
			var platform = new Platform(stop, keys[2]);
			platform.setData(platformdata);
			platformdata.relations.route.forEach(function (routeid) {
				platform.addRoute(Route.getById(routeid));
			});
		}
		for (var index in data.events) {
			var eventdata = data.events[index];
			var keys = index.split(',');
			var vehiclenetwork = new Network(keys[0]);
			var route = new Route(vehiclenetwork, keys[1]);
			var vehicle = new Vehicle(route, keys[2]);
			var platformnetwork = new Network(keys[3]);
			var stop = new Stop(platformnetwork, keys[4]);
			var platform = new Platform(stop, keys[5]);
			var event = new Event(vehicle, platform);
			event.setData(eventdata);
		}
	})
}


module.exports = {
	start: start,
	refresh: loadServerData,
}