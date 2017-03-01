var req = require('request');
var Route = require('../classes/route');
var Stop = require('../classes/stop');
var Platform = require('../classes/platform');
var Event = require('../classes/event');
var Vehicle = require('../classes/vehicle');
var Network = require('../classes/network');
var Moment = require('moment-timezone');

function start() {
	setInterval(loadlines, 30000);
	loadlines();
}
var supportedModes = ["tube", "dlr", "river-bus", "tflrail", "overground", "tram"];
function tflapireq(path, callback) {
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
	req(url, function (err, resp, rawbody) {
		if (err) {
			console.error(err);
			return;
		}
		try {
			parsed = JSON.parse(rawbody);
			callback(parsed);
		} catch (e) {
			console.error(url, rawbody);
			callback([]);
		}
	});
}
function loadlines() {
	tflapireq("/Line/Route", function (lines) {
		var lineids = [];
		lines.forEach(function (linedata) {
			if (supportedModes.indexOf(linedata.modeName) == -1) return;
			var network = new Network(linedata.modeName);
			var route = new Route(network, linedata.id);
			route.setField('title', linedata.name);
			route.setField('name', linedata.name);
			route.refresh = refreshLine;
			route.attemptRefresh();
			lineids.push(linedata.id);
		});
		tflapireq("/Line/"+lineids.join(',')+"/Status", function (lines) {
			lines.forEach(function (linedata) {
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

		})
	});
}
function refreshLine(callback) {
	var route = this;
	tflapireq("/Line/"+route.getCode()+"/StopPoints", function (stops) {
		stops.forEach(function (stopdata) {

			// Ignore child stations - currently only piers have these, but arrivals only identify the parent station.
			if (stopdata.naptanId != stopdata.stationNaptan) return;
			var stop = new Stop(route.getNetwork(), stopdata.naptanId);
			stop.setField('title', stopdata.commonName);


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
		tflapireq("/Line/"+route.getCode()+"/Arrivals", function (arrivals) {

			// Find all the platforms serving this line which have ghost trains
			// And clear them up
			// NB: this will break if one of these platforms serves multiple routes
			// but I don't think there are any like that...
			route.getStops().forEach(function (stop) {
				stop.getPlatforms().forEach(function (platform) {
					if (platform.getField('hasghosts')) {
						platform.getEvents().forEach(function (event) {
							event.getVehicle().deleteSelf();
							event.deleteSelf();
						});
					}
				});
			});
			arrivals.forEach(function (arrival) {
				
				var stop = new Stop(route.getNetwork(), arrival.naptanId);

				// Stops which aren't listed in the StopPoints API, but are in the Arrivals API
				// are a bit weird.  Do the best possible with limited info
				if (!stop.getField("title")) {

					// Preceding tilte with ¿ will move these stations to the bottom of route lists
					stop.setField("title", "¿"+arrival.stationName+"?");
				}
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
				var event = new Event(vehicle, platform);
				event.setField('time', new Date(arrival.expectedArrival));
				event.updateRelTime();
			});
			callback();
		});
	});
}

module.exports = {
	start: start,
	refresh: loadlines,
}