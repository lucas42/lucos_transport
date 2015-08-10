var Stop = require('../classes/stop');
Route = require('../classes/route');
function loadLocalData() {
	var interchanges = require('../../data/interchanges.json');
	interchanges.forEach(function(interchange) {
		var stops = [];
		interchange.forEach(function (stopdata) {
			if (!stopdata.code) stopdata.code = stopdata.name;
			var id = [stopdata.network, stopdata.code];
			var stop = Stop.getCreate(id);
			stop.setField('network', stopdata.network);
			stop.setField('code', stopdata.code);
			if (!stop.getField('title')) {
				if (stopdata.name) stop.setField('title', stopdata.name);
				else stop.setField('title', stopdata.network+" stop "+stopdata.code);
			}
			stops.push(stop);

			// For non-tube networks, make sure a route exists
			if (stopdata.network != "tube") {
				var route = Route.getCreate([stopdata.network, ""]);
				route.setField('network', stopdata.network);
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