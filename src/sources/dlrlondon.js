var req = require('request');
var htmlparser = require("htmlparser2");
var select = require('soupselect').select;
var Route = require('../classes/route');
var Stop = require('../classes/stop');
var Platform = require('../classes/platform');
var Event = require('../classes/event');
var Vehicle = require('../classes/vehicle');
var Network = require('../classes/network');

var network = new Network("dlr");
var route = new Route(network, "");
function start() {
	setInterval(processstations, 300000);
	processstations();
}

function processstations() {
	console.log("Updating DRL Stations");
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
			});
		});
		var parser = new htmlparser.Parser(handler);
		parser.write(rawbody);
		parser.done();
	});
}

module.exports = {
	start: start,
}