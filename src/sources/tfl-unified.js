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
var supportedModes = ["tube", "dlr", "river-bus", "tfl-rail", "overground"];
function loadlines() {
	req("https://api.tfl.gov.uk/Line/Route", function (err, resp, rawbody) {
		if (err) {
			console.error(err);
			return;
		}
		var lines = JSON.parse(rawbody);
		var lineids = [];
		lines.forEach(function (linedata) {
			if (supportedModes.indexOf(linedata.modeName) == -1) return;
			var network = new Network(linedata.modeName);
			var route = new Route(network, linedata.id);
			route.setField('title', linedata.name);
			route.setField('name', linedata.name);
			route.refresh = refreshLine;
			lineids.push(linedata.id);
		});
		req("https://api.tfl.gov.uk/Line/"+lineids.join(',')+"/Status", function (err, resp, rawbody) {

			if (err) {
				console.error(err);
				return;
			}
			var lines = JSON.parse(rawbody);

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
	req("https://api.tfl.gov.uk/Line/"+route.getCode()+"/StopPoints", function (err, resp, rawbody) {

		if (err) {
			console.error(err);
			return;
		}
		var stops = JSON.parse(rawbody);

		stops.forEach(function (stopdata) {
			var stop = new Stop(route.getNetwork(), stopdata.naptanId);
			stop.setField('title', stopdata.commonName);


			// Add all interchanges for this stop (even if there's no trains on departure boards)
			stopdata.lineModeGroups.forEach(function (networkdata) {
				if (supportedModes.indexOf(networkdata.modeName) == -1) return;
				var network = new Network(networkdata.modeName);
				if (network == route.getNetwork()) return;
				networkdata.lineIdentifier.forEach(function (lineid) {
					var interchange = new Stop(network, lineid);
					stop.addExternalInterchange(interchange);
				});
			});


			route.addStop(stop);
		});
		req("https://api.tfl.gov.uk/Line/"+route.getCode()+"/Arrivals", function (err, resp, rawbody) {
			if (err) {
				console.error(err);
				return;
			}
			var arrivals = JSON.parse(rawbody);
			arrivals.forEach(function (arrival) {
				//console.log(arrival);
				var stop = new Stop(route.getNetwork(), arrival.naptanId);
				route.addStop(stop);

				// API sends the string 'null', rather than a null value
				if (arrival.platformName == 'null') {
					arrival.platformName = null;
				}
				var platform = new Platform(stop, arrival.platformName);
				var vehicle = new Vehicle(route, arrival.vehicleId);
				vehicle.setField('destination', arrival.destinationName);
				var event = new Event(vehicle, platform);
				event.setField('time', new Date(arrival.expectedArrival));
			});
			callback();
		});
	});
}

module.exports = {
	start: start,
}