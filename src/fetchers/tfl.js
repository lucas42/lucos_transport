require('es6-promise').polyfill();
require('isomorphic-fetch');
const Route = require('../classes/route');
const Network = require('../classes/network');
const Stop = require('../classes/stop');
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
	fetch: function (type, id) {
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
			case "route":
				var network, route;
				return tflapireq("/Line/"+id).then(({data, date}) => {
					if (!data.length) throw "notfound";
					network = new Network(data[0].modeName);
					route = new Route(network, id);
					route.setField("name", data[0].name);
					route.setField("title", data[0].name);
					return tflapireq("/Line/"+route.getCode()+"/StopPoints");
				}).then(({data, date}) => {
					data.forEach(stopdata => {

						// Ignore child stations - currently only piers have these, but arrivals only identify the parent station.
						if (stopdata.naptanId != stopdata.stationNaptan) return;
						var stop = new Stop(route.getNetwork(), stopdata.naptanId);
						stop.setField('title', stopdata.commonName);
						stop.setField('lastUpdated', date);

						// Add all interchanges for this stop (even if there's no trains on departure boards)
						stopdata.lineModeGroups.forEach(function (networkdata) {
							if (supportedModes.indexOf(networkdata.modeName) == -1) return;
							var network = new Network(networkdata.modeName);
							if (network == route.getNetwork()) return;
							networkdata.lineIdentifier.forEach(function (lineid) {
								var interchange = new Stop(network, stopdata.naptanId);
								if (!interchange.getField('title')) stop.setField('title', stopdata.commonName);
								stop.addExternalInterchange(interchange);
							});
						});
						stopdata.additionalProperties.forEach(function (additionaldata) {
							if (additionaldata.key == "WiFi") {
								stop.setField('wifi', additionaldata.value == "yes");
							}
							if (additionaldata.key == "Zone") {
								stop.setField('zone', additionaldata.value);
							}

							// There are 2 fields about toilets (presumably from different sources) - try both.
							if (additionaldata.key == "Toilets" && additionaldata.value.indexOf("yes") == 0) {
								stop.setField('toilet', true);

								// If there's a note, it follows 'yes', then a space.  It's usually surrounded by brackets
								if (additionaldata.value.length > 4) {
									stop.setField('toiletnote', additionaldata.value.substr(4));
								}
							}
							if (additionaldata.key == "Toilet" && additionaldata.value == "Yes") {
								stop.setField('toilet', true);
							}

							// TolietNote values are usually surrounded by brackets
							if (additionaldata.key == "ToiletNote") {
								stop.setField('toiletnote', additionaldata.value);
							}
						});

						route.addStop(stop);
					});
					return route.getDataTree();
				});
			default:
				return Promise.reject(`Unknown type '${type}'`);
		}
	}
}