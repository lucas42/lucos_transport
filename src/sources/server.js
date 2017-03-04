/**
 * Fetches serialised data from the server
 * for deserialising on the client
 */
 const DATA_CACHE = 'data-v1';
 const DATA_URL = '/data.json';

function start() {
	setInterval(loadFromServer, 30000);
	loadFromServer();
}

const Stop = require('../classes/stop'),
Route = require('../classes/route'),
Network = require('../classes/network'),
Vehicle = require('../classes/vehicle'),
Platform = require('../classes/platform'),
Event = require('../classes/event');

let dataLoaded = false;

function loadFromServer() {
	return fetch(DATA_URL).then(response => {
		return caches.open(DATA_CACHE).then(cache => {
			cache.put(DATA_URL, response.clone());
		}).then(() => {
			return response.json();
		});
	}).then(parseData).catch(error => {
		console.error("Can't load data from server", error);
	});
}
function loadFromCache() {
	if (dataLoaded) return Promise.resolve(null);
	return caches.open(DATA_CACHE).then(cache => {
		return cache.match(DATA_URL);
	}).then(response => {
		if (!response) {
			debugger;
			console.error("Data not found in cache");
			return;
		}
		return response.json().then(parseData);
	});
}


function parseData(data) {
	var index, network, stopdata, keys, stop, routedata, route, vehicledata, vehicle, platformdata, platform, eventdata, vehiclenetwork, platformnetwork, event;
	if (!data) {
		console.error("No data on refresh");
		return;
	}
	for (index in data.networks) {
		network = new Network(index);
		network.setData(data.networks[index]);
	}
	for (index in data.stops) {
		stopdata = data.stops[index];
		keys = index.split(',');
		network = new Network(keys[0]);
		stop = new Stop(network, keys[1]);
		stop.setData(stopdata);
		stopdata.relations.externalInterchange.forEach(function (interchangeid) {
			var interchange = Stop.getById(interchangeid);

			// If the other stop doesn't exist, ignre.  It's a symetrical relationship so will get added be the 2nd stop
			if (!interchange) return;
			stop.addExternalInterchange(interchange);
		});
	}
	for (index in data.routes) {
		routedata = data.routes[index];
		keys = index.split(',');
		network = new Network(keys[0]);
		route = new Route(network, keys[1]);
		route.setData(routedata);
		routedata.relations.stop.forEach(function (stopid) {
			route.addStop(Stop.getById(stopid));
		});
	}
	for (index in data.vehicles) {
		vehicledata = data.vehicles[index];
		keys = index.split(',');
		network = new Network(keys[0]);
		route = new Route(network, keys[1]);
		vehicle = new Vehicle(route, keys[2]);
		vehicle.setData(vehicledata);
	}
	for (index in data.platforms) {
		platformdata = data.platforms[index];
		keys = index.split(',');
		network = new Network(keys[0]);
		stop = new Stop(network, keys[1]);
		platform = new Platform(stop, keys[2]);
		platform.setData(platformdata);
		platformdata.relations.route.forEach(function (routeid) {
			platform.addRoute(Route.getById(routeid));
		});
	}
	for (index in data.events) {
		eventdata = data.events[index];
		keys = index.split(',');
		vehiclenetwork = new Network(keys[0]);
		route = new Route(vehiclenetwork, keys[1]);
		vehicle = new Vehicle(route, keys[2]);
		platformnetwork = new Network(keys[3]);
		stop = new Stop(platformnetwork, keys[4]);
		platform = new Platform(stop, keys[5]);
		event = new Event(vehicle, platform);
		event.setData(eventdata);
	}
	dataLoaded = true;
}

module.exports = {
	start: start,
	refresh: loadFromServer,
	loadFromCache: loadFromCache,
}