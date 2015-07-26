var req = require('request');
var xml = require('xml2js');
var Route = require('./classes/route');
var Stop = require('./classes/stop');
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
						routeid = "TN-I";
						data.network = "tube";
						data.title = "Circle Line";
						break;
					case "DLR":
						routeid = "DLR";
						data.network = "dlr";
						data.title = "Docklands Light Railway";
						break;
					case "TfL Rail":
						routeid = "TflRail";
						data.network = "TflRail";
						data.title = "TfL Rail";
						break;
					case "Overground":
						routeid = "Overground";
						data.network = "overground";
						data.title = "London Overground";
						break;
					default:
						routeid = "TN-"+data.name[0];
						data.network = "tube";
						data.title = data.name+" Line";
						refresh = createRefresh(data.name[0]);
						break;
				}
				var linecode = getLineCode(data.name);
				var route = Route.update(routeid, data);
				if (refresh) route.refresh = refresh;
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
		req("http://cloud.tfl.gov.uk/TrackerNet/PredictionSummary/"+linecode, function (err, resp, rawbody) {
			if (err) {
				callback(err);
				return;
			}
			xml.parseString(rawbody, function(err, body){
				if (err) {
					callback(err);
					return;
				}
				if (!body) {
					var err = 'No TrackerNet data for Line code '+linecode
					callback(err);
					console.error(err);
					return;
				}
				var validtime = body.ROOT.Time[0].$.TimeStamp;
				body.ROOT.S.forEach(function (stopstatus) {
					var stopdata = {
						code: stopstatus.$.Code,
						name: stopstatus.$.N.replace(/\.$/,''),
					}
					var stop = Stop.update("TN-"+stopdata.code, stopdata);
					route.addStop(stop);
				})
				callback();
			});
		});
	};
}

module.exports = {
	start: start,
}