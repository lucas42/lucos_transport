var req = require('request');
var htmlparser = require("htmlparser2");
var select = require('soupselect').select;
var Route = require('../classes/route');
var Stop = require('../classes/stop');
var Platform = require('../classes/platform');
var Event = require('../classes/event');
var Vehicle = require('../classes/vehicle');
var Network = require('../classes/network');
var Moment = require('moment-timezone');

var network = new Network("dlr");
var route = new Route(network, "dlr");
function start() {
	setInterval(loadstations, 30000);
	loadstations();
}

function loadstations() {
	console.log("Updating DLR Stations");
	req("http://www.dlrlondon.co.uk/mobile/Departures.aspx", function (err, resp, rawbody) {
		if (err) {
			console.error(err);
			return;
		}
		var handler = new htmlparser.DomHandler(function (err, dom) {
			if (err) {
				console.error(err);
				return;
			}
			select(dom, "#stationDepartures option").forEach(function(element) {

				// Ignore the "select your station" option
				if (!element.attribs.value) return;
				var stop = new Stop(network, element.attribs.value);
				stop.setField('title', element.children[0].data);
				route.addStop(stop);
				loadStation(stop);
			});
		});
		var parser = new htmlparser.Parser(handler);
		parser.write(rawbody);
		parser.done();
	});
}

function loadStation(stop) {

	// This first request clears the cache for the second request.  You what?!?
	req("http://www.dlrlondon.co.uk/mobile/DeparturesInfo.aspx?stn="+stop.getCode(), function (err, resp, rawbody) {
		req("http://www.dlrlondon.co.uk/xml/mobile/"+stop.getCode()+".xml", function (err, resp, rawbody) {
			if (err) {
				console.error(err);
				return;
			}
			var handler = new htmlparser.DomHandler(function (err, dom) {
				if (err) {
					console.error(err);
					return;
				}
				select(dom, "ttboxset").forEach(function(topelement) {
					topelement.children.forEach(function (platformelement) {
						if (platformelement.name != "div") return;
						var platformleft = select(platformelement, "#platformleft img")[0].attribs.src.match(/\d+[^lr]?/)[0];
						var platformright = select(platformelement, "#platformright img")[0].attribs.src.match(/\d+[^lr]?/)[0];
						var platformcode;

						// At most stations, trains stop at one platform at a time
						if (platformleft == platformright) {
							platformcode = "Platform "+platformleft;

						// At Canary Wharf, trains stop inbetween 2 platforms
						} else {
							platformcode = "Platforms "+platformleft+" & "+platformright;
						}
						var platform = new Platform(stop, platformcode);
						platform.addRoute(route);

						// Remove existing events and trains, because data source has no way to identify specific trains
						platform.getEvents().forEach(function (event) {
							event.getVehicle().deleteSelf();
							event.deleteSelf();
						});

						var rawtime = select(platformelement, "#time")[0].children[0].data.trim();

						// Times appear to be London time
						var validtime = Moment.tz(rawtime, "HH:mm", "Europe/London").toDate();

						// HACK: Can't trust the DLR site's time.
						// Using the time on this server seems more reliable
						// Hopefully the weird cache-busting trick above will prevent
						// caching issues with this approach.
						var validtime = new Date();
						var trains = [];
						var firsttrain = select(platformelement, "#line1")[0].children[0].data.trim();
						if (firsttrain) trains.push(firsttrain);
						select(platformelement, "#line23 p")[0].children.forEach(function (trainelement) {
							if (trainelement.type != "text") return;
							var traintext = trainelement.data.trim();
							if (traintext) trains.push(traintext);
						});
						trains.forEach(function (traintext) {
							var parsed = traintext.match(/^(?:\d+\s*)?(.+?)(?:\s*(\d+)\s+mins?)?$/i);
							var destination = parsed[1];
							var minutes = parsed[2];
							var eventdata = {
								timetostation: minutes,
							};
							if (!minutes) {
								eventdata.time = validtime;
							} else {
								eventdata.time = new Date(validtime.getTime() + (minutes * 60000));
							}
							var vehicledata = {
								destination: destination,
								ghost: true
							};
							
							// DLR data doesn't have train IDs.  So make up a random
							// one and hopefully none will clash.
							var vehicle = new Vehicle(route, Math.random());
							vehicle.setData(vehicledata);
							var event = new Event(vehicle, platform);
							event.setData(eventdata);
						});
					});
				});
			});
			var parser = new htmlparser.Parser(handler);
			parser.write(rawbody);
			parser.done();
		});
	});

}

module.exports = {
	start: start,
}