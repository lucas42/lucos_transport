var Stop = require('../classes/stop');
var Route = require('../classes/route');
var Network = require('../classes/network');
function loadLocalData() {
	var interchanges = require('../../data/interchanges.json');
	interchanges.forEach(function(interchange) {
		var stops = [];
		interchange.forEach(function (stopdata) {
			if (!stopdata.code) stopdata.code = stopdata.name;
			if (!stopdata.code) {
				console.error("No code or name specified for interchange. ", stopdata);
				return;
			}
			var network = new Network(stopdata.network);
			var stop = new Stop(network, stopdata.code);
			if (!stop.getField('title')) {
				if (stopdata.name) stop.setField('title', stopdata.name);
				else stop.setField('title', network.getCode()+" stop "+stopdata.code);
			}
			stops.push(stop);

			// For networks which aren't retreived elsewhere, make sure a route exists
			if (["national-rail", "bus"].indexOf(network.getCode()) != -1) {
				var route = new Route(network, "");
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