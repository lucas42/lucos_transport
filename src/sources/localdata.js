var Stop = require('../classes/stop');
var Route = require('../classes/route');
var Network = require('../classes/network');
function loadLocalData() {
	var interchanges = require('../../data/interchanges.json');
	interchanges.forEach(function(interchange) {
		var stops = [];
		interchange.forEach(function (stopdata) {
			if (!stopdata.code) stopdata.code = stopdata.name;
			var network = Network.getCreate(stopdata.network);
			var id = [network.getId(), stopdata.code];
			var stop = Stop.getCreate(id);
			stop.setField('network', network);
			stop.setField('code', stopdata.code);
			if (!stop.getField('title')) {
				if (stopdata.name) stop.setField('title', stopdata.name);
				else stop.setField('title', network.getId()+" stop "+stopdata.code);
			}
			stops.push(stop);

			// For non-tube networks, make sure a route exists
			if (network.getId() != "tube") {
				var route = Route.getCreate([network.getId(), ""]);
				route.setField('network', network);
				route.setField('routecode', '');
				route.setField('title', stopdata.network);
				route.setField('name', stopdata.network);
				route.addStop(stop);
			}
		});
		stops.forEach(function (stop) {
			stops.forEach(function (interchange) {
				if (stop == interchange) return;
				stop.addExternalInterchange(interchange);
			})
			
		});
	});
}


module.exports = {

	// Only load data once, because it comes from static files
	start: loadLocalData,
}