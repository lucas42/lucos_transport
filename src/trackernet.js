var req = require('request');
var xml = require('xml2js');
var Route = require('./classes/route');
function start() {
	setInterval(processlines, 300000);
	processlines();
}

function processlines() {
	console.log("Updating Line Statuses from TrackerNet");
	req("http://cloud.tfl.gov.uk/TrackerNet/LineStatus", function processlines(err, resp, rawbody) {
		if (err) {
			console.err(err);
			return;
		}
		xml.parseString(rawbody, function(err, body){
			body.ArrayOfLineStatus.LineStatus.forEach(function (linestatus) {
				var data = {
					name: linestatus.Line[0].$.Name,
					status:linestatus.Status[0].$.Description,
					details:linestatus.$.StatusDetails,
				}
				Route.update("TN-"+getLineCode(data.name), data);
			});
		});
	});
}


/**
 * Identify lines by the train prediction service line Code (different to Network Status line ID)
 */
function getLineCode(name) {
	switch(name) {

		// Treat Circle as a separate case, because trackernet bundles it with Hammersmith and City
		case "Cirle":
			return "I";
		default:
			return name[0];
	}
}


module.exports = {
	start: start,
}