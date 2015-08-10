Thing = require('./thing');
function Route() {
	Thing.apply(this, arguments);
	this.addRelation('stop');
}
Thing.extend(Route);
Route.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	output.cssClass = this.getCssClass();
	return output;
}
Route.prototype.getLink = function getLink() {
	return "/route/"+this.getField('network')+"/"+this.getField('routecode');
}
Route.prototype.getCssClass = function getCssClass() {
	var name = this.getField('name');
	return "route route_"+name.replace(/[ &]|and/g,'').toLowerCase();
}
Route.getByStop = function getByStop(stop) {
	return Route.getByRelatedThing('stop', stop);
}
module.exports = Route;