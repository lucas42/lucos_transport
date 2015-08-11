Thing = require('./thing');
var Symbols = require('../../data/symbols.json');
function Route() {
	Thing.apply(this, arguments);
	this.addRelation('stop');
}
Thing.extend(Route);
Route.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	output.cssClass = this.getCssClass();
	output.symbol = Symbols[this.getField('network').getId()];
	output.network = output.network.getId();
	return output;
}
Route.prototype.getLink = function getLink() {
	return "/route/"+this.getField('network').getId()+"/"+this.getField('routecode');
}
Route.prototype.getCssClass = function getCssClass() {
	var name = this.getField('name');
	if (!name) return "";
	return "route_"+name.replace(/[ &]|and/g,'').toLowerCase();
}
Route.getByStop = function getByStop(stop) {
	return Route.getByRelatedThing('stop', stop).sort(sortRoutes);
}
function sortRoutes(a, b) {
	var neta = a.getField("network").getId();
	var netb = b.getField("network").getId();

	// Make sure all the tube lines go at the top
	if (neta != netb) {
		if (neta == 'tube') return -1;
		if (netb == 'tube') return 1;
		if (neta == 'dlr') return -1;
		if (netb == 'dlr') return 1;
		if (neta == 'overground') return -1;
		if (netb == 'overgound') return 1;
	}
	return a.getField("title") > b.getField("title") ? 1 : -1;
}
Route.getAllSorted = function getAllSorted() {
	return Route.getAll().sort(sortRoutes);
}
module.exports = Route;