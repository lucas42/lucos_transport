/**
 * Fetches serialised data from the server
 * for deserialising on the client
 */

var Stop = require('../classes/stop');
var Route = require('../classes/route');
var Network = require('../classes/network');
function loadServerData() {
	fetch('/data.json').then(function (response) {
		return response.json();
	}).then(function (data) {
		for (var index in data.networks) {
			var netdata = data.networks[index];
			var keys = index.split(',');
			keys.unshift(null);
			var network = new (Function.prototype.bind.apply(Network, keys));
			network.setData(netdata);
		}
		for (var index in data.routes) {
			var routedata = data.routes[index];
			var keys = index.split(',');
			keys.unshift(null);
			keys[1] = new Network(keys[1]);
			var route = new (Function.prototype.bind.apply(Route, keys));
			route.setData(routedata);
		}
	})
}


module.exports = {

	// Only load data once, because it comes from static files
	start: loadServerData,
}