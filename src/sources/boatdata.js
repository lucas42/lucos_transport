import Network from '../classes/network.js'
import Route from '../classes/route.js'
import Vehicle from '../classes/vehicle.js'

// Names originally come from http://content.tfl.gov.uk/tfl-live-bus-river-bus-arrivals-api-documentation-v16.pdf
// Though the docs are now out-of-date due to new boats
import boats from '../data/boatnames.json' with { type: "json" }

// Only load data once, because it comes from static files
export function start() {

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
			boat.setField("name", boats[id]);
		});
	}
}

export default { start }