Thing = require('./thing');
function Route() {
	Thing.apply(this, arguments);
	var stops = {};
	this.addStop = function addStop(stop) {
		stops[stop.getId()] = stop;
	}
	this.getStops = function getStops() {
		var output = []
		for (i in stops) output.push(stops[i]);
		return output;
	}

}
Thing.extend(Route);
Route.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/route/"+this.getId();
	output.cssClass = "route_"+output.name.replace(/[ &]|and/g,'').toLowerCase();
	return output;
}

module.exports = Route;