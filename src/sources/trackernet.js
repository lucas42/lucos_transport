var req = require('request');
var xml = require('xml2js');
var Route = require('../classes/route');
var Stop = require('../classes/stop');
var Platform = require('../classes/platform');
var Event = require('../classes/event');
var Vehicle = require('../classes/vehicle');
var Network = require('../classes/network');
var Moment = require('moment-timezone');
function start() {
	setInterval(processlines, 300000);
	processlines();
}

function processlines() {
	console.log("Updating Line Statuses from TrackerNet");
	req("http://cloud.tfl.gov.uk/TrackerNet/LineStatus", function (err, resp, rawbody) {
		if (err) {
			console.error(err);
			return;
		}
		xml.parseString(rawbody, function(err, body){
			body.ArrayOfLineStatus.LineStatus.forEach(function (linestatus) {
				var data = {
					name: linestatus.Line[0].$.Name,
					status:linestatus.Status[0].$.Description,
					details:linestatus.$.StatusDetails,
				}
				data.title = data.name + " Line";
				var refresh, route;
				switch(data.name) {

					// Treat Circle as a separate case, because trackernet bundles it with Hammersmith and City
					case "Circle":
						route = new Route(new Network("tube"), "I");
						data.title = "Circle Line";
						break;
					case "DLR":
						route = new Route(new Network("dlr"), "");
						data.title = "DLR";
						break;
					case "TfL Rail":
						route = new Route(new Network("TflRail"), "");
						data.title = "TfL Rail";
						break;
					case "Overground":
						route = new Route(new Network("overground"), "");
						data.title = "London Overground";
						break;
					default:
						route = new Route(new Network("tube"), data.name[0]);
						data.title = data.name+" Line";
						route.refresh = createRefresh(data.name[0]);
						break;
				}
				route.setData(data);
				route.attemptRefresh();
			});
		});
	});
}

var overground_regex = new RegExp('overground to ', 'i');
var overground = new Route(new Network("overground"), "");
function createRefresh(linecode) {
	return function processline(callback) {
		if (!callback) callback = function(){};
		var route = this;
		var url = "http://cloud.tfl.gov.uk/TrackerNet/PredictionSummary/"+linecode;
		req(url, function (err, resp, rawbody) {
			if (err) {
				callback(err);
				return;
			}
			xml.parseString(rawbody, function(err, body){
				if (err) {
					console.error(url, err);
					callback(err);
					return;
				}
				if (!body) {
					var err = 'No TrackerNet data for Line code '+linecode
					console.error(url, err);
					callback(err);
					return;
				}

				// Tracker Net uses a weird time format and doesn't document its timezone (London Time)
				var validtime = Moment.tz(body.ROOT.Time[0].$.TimeStamp, "YYYY/MM/DD HH:mm:ss", "Europe/London").toDate();
				body.ROOT.S.forEach(function (stopstatus) {
					var stopdata = {
						title: stopstatus.$.N.replace(/\.$/,''),
					}
					var stop = new Stop(new Network("tube"), stopstatus.$.Code);
					stop.setData(stopdata);
					route.addStop(stop);
					var overgroundonlyplatforms = 0;
					stopstatus.P.forEach(function (platformstatus) {

						// TODO: need to handle refresh being called lots of times
						var platform = new Platform(stop, platformstatus.$.N);
						platform.addRoute(route);

						if (platformstatus.T) platformstatus.T.forEach(function (eventstatus) {
							var eventdata = {
								timetostation: eventstatus.$.C,
							};
							if (eventstatus.$.C == '-' || eventstatus.$.C == 'due') {
								eventdata.time = validtime;
							} else {
								var timetostation = eventstatus.$.C.split(':');
								eventdata.time = new Date(validtime.getTime() + (timetostation[0] * 60000) + (timetostation[1] * 1000));
							}
							var vehicledata = {
								destination: eventstatus.$.DE,
							};
							var vehicleroute = route;
							var vehiclecode = eventstatus.$.S;

							// Hack for dealing with overground trains which appear in bakerloo line feeds.
							if (overground_regex.test(vehicledata.destination)) {
								vehicledata.destination = vehicledata.destination.replace(overground_regex, '');
								vehicleroute = overground;
								platform.addRoute(overground);
								overground.addStop(stop);

								// The set numbers for overgroud trains are fictional.
								vehicledata.ghost = true;
							}
							if (vehiclecode == '000') vehicledata.ghost = true;

							// To stop all ghost vehicles having the same destination,
							// make up a random code for them.
							if (vehicledata.ghost) {
								vehiclecode = Math.random();
							}
							var vehicle = new Vehicle(vehicleroute, vehiclecode);
							vehicle.setData(vehicledata);
							var event = new Event(vehicle, platform);
							event.setData(eventdata);
						});

						// Look for platforms which have overgound trains and nothing else.
						if (platform.hasRoute(overground)) {
							var alloverground = true;
							platform.getEvents().forEach(function (event) {
								if (event.getVehicle().getRoute() != overground) {
									alloverground = false;
								}
							})
							if (alloverground) {

								// Remove the non-overground routes from the platform
								platform.getRoutes().forEach(function (route) {
									if (route != overground) platform.removeRoute(route);
								});
								overgroundonlyplatforms++;
							}
							var routes = platform.getRoutes();
						}
					});

					// Stations which contain only overground platforms and no underground trains shouldn't be consider underground stations
					if (overgroundonlyplatforms && stop.getPlatforms().length == overgroundonlyplatforms) {
						route.removeStop(stop);
					}
				})
				callback();
			});
		});
	};
}

module.exports = {
	start: start,
}