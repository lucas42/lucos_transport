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
	return "/route/"+this.getId();
}
Route.prototype.getCssClass = function getCssClass() {
	var name = this.getField('name');
	return "route_"+name.replace(/[ &]|and/g,'').toLowerCase();
}

module.exports = Route;