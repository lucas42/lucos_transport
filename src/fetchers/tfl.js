require('es6-promise').polyfill();
require('isomorphic-fetch');
const Route = require('../classes/route');
const Network = require('../classes/network');
const Stop = require('../classes/stop');
const Platform = require('../classes/platform');
const Event = require('../classes/event');
const Vehicle = require('../classes/vehicle');
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
	fetch: function (type, id, params) {
		switch (type) {
			case "routes": {
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
						title: 'TFL Services',
					}

				});
			}
			case "route": {
				let network, route;
				return tflapireq("/Line/"+id).then(({data, date}) => {
					if (!data.length) throw "notfound";
					network = new Network(data[0].modeName);
					route = new Route(network, id);
					route.setField("name", data[0].name);
					route.setField("title", data[0].name);
					route.setField("lastUpdated", date);
					return tflapireq("/Line/"+route.getCode()+"/StopPoints");
				}).then(({data, date}) => {
					data.forEach(data => {

						// Ignore child stations - These will be added as platforms on the stop page
						if (data.naptanId != data.stationNaptan) return;
						var stop = new Stop(route.getNetwork(), data.naptanId);
						stop.setField('title', data.commonName);
						stop.setField('lastUpdated', date);

						// Add all interchanges for this stop (even if there's no trains on departure boards)
						data.lineModeGroups.forEach(function (networkdata) {
							if (supportedModes.indexOf(networkdata.modeName) == -1) return;
							var network = new Network(networkdata.modeName);
							if (network == route.getNetwork()) return;
							networkdata.lineIdentifier.forEach(function (lineid) {
								var interchange = new Stop(network, data.naptanId);
								if (!interchange.getField('title')) stop.setField('title', data.commonName);
								stop.addExternalInterchange(interchange);
							});
						});
						data.additionalProperties.forEach(function (additionaldata) {
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
			}
			case "stop": {
				let network = new Network('tfl');
				let stop;
				return tflapireq("/StopPoint/"+id).then(({data, date}) => {
					stop = new Stop(network, id);
					stop.setField('title', data.commonName);
					stop.setField('lastUpdated', date);

					// Add all interchanges for this stop (even if there's no trains on departure boards)
					/*data.lineModeGroups.forEach(function (networkdata) {
						if (supportedModes.indexOf(networkdata.modeName) == -1) return;
						var network = new Network(networkdata.modeName);
						if (network == route.getNetwork()) return;
						networkdata.lineIdentifier.forEach(function (lineid) {
							var interchange = new Stop(network, data.naptanId);
							if (!interchange.getField('title')) stop.setField('title', data.commonName);
							stop.addExternalInterchange(interchange);
						});
					});*/
					data.additionalProperties.forEach(function (additionaldata) {
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
					let routeModes = {};
					data.lineModeGroups.forEach(modegroup => {
						modegroup.lineIdentifier.forEach(lineid => {
							routeModes[lineid] = modegroup.modeName;
						})
					});
					let StopPointReqs = data.lineGroup.map(stoppoint => {

						// Really hacky way to work out which ID to use when looking up arrival data
						let id;
						if (routeModes[stoppoint.lineIdentifier[0]] == "bus") {
							id = stoppoint.naptanIdReference;
						} else {
							id = stoppoint.stationAtcoCode;
						}
						return tflapireq("/StopPoint/"+id+"/Arrivals");
					});
					return Promise.all(StopPointReqs);
				}).then(allpoints => {
					allpoints.forEach(({data, date}) => {
						data.forEach(function (arrival) {
							var route = new Route(new Network(arrival.modeName), arrival.lineId);
							route.addStop(stop);

							// API sends the string 'null', rather than a null value
							if (arrival.platformName == 'null') {
								arrival.platformName = null;
							}
							var platform = new Platform(stop, arrival.platformName);
							platform.addRoute(route);
							var vehicle;
							if (arrival.vehicleId) {
								vehicle = new Vehicle(route, arrival.vehicleId);

							// If there's no vehicle ID, then make up a random one and mark it as a ghost
							} else {
								vehicle = new Vehicle(route, Math.random());
								vehicle.setField('ghost', true);
								platform.setField('hasghosts', true);
							}

							vehicle.setField('destination', arrival.destinationName);
							vehicle.setField('lastUpdated', date);
							var event = new Event(vehicle, platform);
							event.setField('time', new Date(arrival.expectedArrival));
							event.setField('lastUpdated', date);
							event.updateRelTime();
						});
					});
					return stop.getDataTree();
				});
			}

			case "vehicle": {
				let route = new Route(new Network(params.mode), params.route);
				let vehicle = new Vehicle(route, id);
				return tflapireq("/Vehicle/"+id+"/Arrivals").then(({data, date}) => {
					data.forEach(function (arrival) {
						var stop = new Stop(new Network(arrival.modeName), arrival.naptanId);
						stop.setField('title', arrival.stationName);
						stop.setField('lastUpdated', date);
						var platform = new Platform(stop, arrival.platformName);
						platform.addRoute(route);
						var event = new Event(vehicle, platform);
						event.setField('time', new Date(arrival.expectedArrival));
						event.setField('lastUpdated', date);
						event.updateRelTime();
					});
				return vehicle.getDataTree();
				});
			}
			default: {
				return Promise.reject("notfound");
			}
		}
	}
}