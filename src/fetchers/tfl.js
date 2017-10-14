require('es6-promise').polyfill();
require('isomorphic-fetch');
const Route = require('../classes/route');
const Network = require('../classes/network');
const supportedModes = ["tube", "dlr", "river-bus", "tflrail", "overground", "tram"];

function tflapireq(path) {
	var parsed;
	var url = "https://api.tfl.gov.uk"+path;
	if (url.indexOf('?') > -1) {
		url += '&';
	} else {
		url += '?';
	}
	url += "app_id="
	if (process.env.TFLAPPID) url += encodeURIComponent(process.env.TFLAPPID);
	url += "&app_key=";
	if (process.env.TFLAPPKEY) url += encodeURIComponent(process.env.TFLAPPKEY);
	return fetch(url).then(response => {
		return response.json().then(data => {
			return {
				data: data, 
				date: response.headers.get('date'),
			};
		})
	});
}

module.exports = {
	fetch: function (type) {
		switch (type) {
			case "routes":
				return tflapireq("/Line/Route").then(({data, date}) => {
					var routes = {};
					data.forEach(function (linedata) {
						if (supportedModes.indexOf(linedata.modeName) == -1) return;
						var network = new Network(linedata.modeName);
						var route = new Route(network, linedata.id);
						route.setField('title', linedata.name);
						route.setField('name', linedata.name);
						route.setField('lastUpdated', date);
						routes[linedata.id] = route;
					});
					return routes;
				}).then(routes => {
					return tflapireq("/Line/"+Object.keys(routes).join(',')+"/Status").then(({data, date}) => {
						data.forEach(function (linedata) {
							var network = new Network(linedata.modeName);
							var route = new Route(network, linedata.id);
							var lowestseverity = 100;
							var loweststatus = "Unknown";
							var details = "";
							linedata.lineStatuses.forEach(function (status) {
								if (status.statusSeverity < lowestseverity) {
									lowestseverity = status.statusSeverity;
									loweststatus = status.statusSeverityDescription;
								}
								if (status.reason) {
									if (details) details += "\n\n";
									details += status.reason.replace(/^[^:]*:\s*/, '');
								}
							});
							route.setField('status', loweststatus);
							route.setField('details', details);
						});
						return Object.values(routes).sort(Route.sort).map(route => route.getData());
					});
				}).then(routeList => {

					return {
						routes: routeList,//Route.getRouteList(),
						//routeData: JSON.stringify(Route.getRouteList(true)),
						lastUpdated: Date.now(),//Route.getOldestUpdateTime(),
						cssClass: 'homepage',
						classType: 'RouteList',
						title: 'TFLuke',
					}

				});
		}
	}
}