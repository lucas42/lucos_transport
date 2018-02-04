var Class = require('./class');
var Event = require('./event');
var Route = require('./route');
var Platform = Class("Platform", ["stop", "name"], function () {
	this.addRelation({
		singular: 'event',
		sort: Event.sortByTime,
	});
	this.addRelation({
		singular: 'route',
		sort: Route.sort,
		nofollow: true,
	});
});


Platform.prototype.getLink = function getLink() {
	return this.getStop().getLink();
}
Platform.prototype.getCssClass = function getCssClass() {
	var cssClass = "";
	if (this.getField("mode")) {
		cssClass += "mode_"+this.getField("mode")+" ";
	}
	if (this.getRoutes().length) {
		cssClass += "route";
		this.getRoutes().forEach(function (route) {
			cssClass += "_"+route.getCode();
		});
	}
	return cssClass;
}
Platform.prototype.getData = function getData() {
	var output = this.getRawData();
	output.name = this.getFullName();
	output.title = output.name;
	output.link = this.getLink();
	output.cssClass = this.getCssClass();
	output.simpleName = this.getSimpleName();
	return output;
}
Platform.prototype.getSimpleName = function getSimpleName() {
	var name = this.getName() || "";
	return name.replace(/.*\- */, '');
}
Platform.prototype.getFullName = function getFullName() {
	switch (this.getField("mode")) {
		case "bus":
			return "Bus Stop "+this.getName();
		case "river-bus":
			if (!this.getName()) {
				return "Uknown Pier";
			}
			return "Pier "+this.getName();
		default:
			return this.getName();
	}
}
module.exports = Platform;