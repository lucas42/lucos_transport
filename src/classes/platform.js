Thing = require('./thing');
Event = require('./event');
function Platform(stop, name, route) {
	Thing.call(this, name);
	this.addRelation('event', 'events', 'platform', Event.sortByTime);
	stop.addPlatform(this);
	var cssClass;

	// TODO handle platforms which serve multiple routes
	if (route) cssClass = route.getCssClass();
	this.setData({
		name: name,
		cssClass: cssClass,
		link: stop.getLink(),
	})
	this.getStop = function getStop() {
		return stop;
	}
}

Platform.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/stop/"+this.getId();
	return output;
}
Thing.extend(Platform);
module.exports = Platform;