/**
 * Fetches serialised data from the server
 * for deserialising on the client
 */

function start() {
	setInterval(loadServerData, 30000);
	loadServerData();
}

var Stop = require('../classes/stop');
var Route = require('../classes/route');
var Network = require('../classes/network');
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
			var routedata = data.stops[index];
			var keys = index.split(',');
			var network = new Network(keys[0]);
			var route = new Stop(network, keys[1]);
			route.setData(routedata);
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
	})
}


module.exports = {
	start: start,
	refresh: loadServerData,
}