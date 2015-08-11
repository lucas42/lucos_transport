Thing = require('./thing');
function Network() {
	Thing.apply(this, arguments);
	this.addRelation('route');
}
Thing.extend(Network);
module.exports = Network;