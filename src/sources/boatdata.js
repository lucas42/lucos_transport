var Vehicle = require('../classes/vehicle');
var Route = require('../classes/route');
var Network = require('../classes/network');
function loadData() {

	// Names originally come from http://content.tfl.gov.uk/tfl-live-bus-river-bus-arrivals-api-documentation-v16.pdf
	// Though the docs are now out-of-date due to new boats
	var boats = require('../../data/boatnames.json');
	var network = new Network('river-bus');
	var routes = [];

	// The same boats can serve any route in the network.
	// Might need to rethink the data model, but for now just 
	// hardcode the relevant routes
	["rb1","rb1x","rb2","rb4","rb5","rb6"].forEach(function (id){
		routes.push(new Route(network, id));
	});
	for (var id in boats) {
		routes.forEach(function (route) {
			var boat = new Vehicle(route, id);
			boat.setField("title", boats[id]+" ("+route.getField("name")+")");
		});
	}
}


module.exports = {

	// Only load data once, because it comes from static files
	start: loadData,
}