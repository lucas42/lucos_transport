Thing = require('./thing');
function Platform(stop, name, route) {
	Thing.call(this, name);
	Thing.addRelation(this, 'event');
	stop.addPlatform(this);
	var cssClass;

	// TODO handle platforms which serve multiple routes
	if (route) cssClass = route.getCssClass();
	this.setData({
		name: name,
		cssClass: cssClass,
	})
}
Thing.extend(Platform);
module.exports = Platform;