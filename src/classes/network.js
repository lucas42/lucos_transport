var Class = require('./class');
var Network = Class('Network', 'code', function () {
	this.addRelation('route');
});
Network.prototype.getCssClass = function getCssClass() {
	return "network_"+this.getCode();
}
module.exports = Network;