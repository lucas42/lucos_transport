Thing = require('./thing');
function Route() {
	Thing.apply(this, arguments);
	Thing.addRelation(this, 'stop');
}
Thing.extend(Route);
Route.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/route/"+this.getId();
	output.cssClass = this.getCssClass();
	return output;
}
Route.prototype.getCssClass = function getCssClass() {
	var name = this.getField('name');
	return "route_"+name.replace(/[ &]|and/g,'').toLowerCase();
}

module.exports = Route;