var req = require('request');
var xml = require('xml2js');
var Route = require('../classes/route');
var Stop = require('../classes/stop');
var Platform = require('../classes/platform');
var Event = require('../classes/event');
var Vehicle = require('../classes/vehicle');
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
				var linecode, refresh;
				switch(data.name) {

					// Treat Circle as a separate case, because trackernet bundles it with Hammersmith and City
					case "Circle":
						data.routecode = "I";
						data.network = "tube";
						data.title = "Circle Line";
						break;
					case "DLR":
						data.routecode = "";
						data.network = "dlr";
						data.title = "DLR";
						break;
					case "TfL Rail":
						data.routecode = "";
						data.network = "TflRail";
						data.title = "TfL Rail";
						break;
					case "Overground":
						data.routecode = "";
						data.network = "overground";
						data.title = "London Overground";
						break;
					default:
						data.routecode = data.name[0];
						data.network = "tube";
						data.title = data.name+" Line";
						refresh = createRefresh(data.name[0]);
						break;
				}
				var linecode = getLineCode(data.name);
				var route = Route.update([data.network, data.routecode], data);
				if (refresh) route.refresh = refresh;
				route.attemptRefresh();
			});
		});
	});
}


/**
 * Identify lines by the train prediction service line Code (different to Network Status line ID)
 */
function getLineCode(name) {
}

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
						network: "tube",
						code: stopstatus.$.Code,
						name: stopstatus.$.N.replace(/\.$/,''),
					}
					stopdata.title = stopdata.name;
					var stop = Stop.update([stopdata.network, stopdata.code], stopdata);
					route.addStop(stop);
					stopstatus.P.forEach(function (platformstatus) {

						// TODO: need to handle refresh being called lots of times
						var platform = new Platform(stop, platformstatus.$.N, route);

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
								route: route,
							};
							if (eventstatus.$.S == '000') vehicledata.ghost = true;
							var vehicle = Vehicle.update(linecode+eventstatus.$.S, vehicledata);
							var event = new Event(vehicle, platform, validtime+"+"+eventdata.timetostation);
							event.setData(eventdata);
							platform.addEvent(event);
						});
					});
				})
				callback();
			});
		});
	};
}

module.exports = {
	start: start,
}