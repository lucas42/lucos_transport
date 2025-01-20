import Class from './class.js';
var Network = Class('Network', 'code', function () {
	this.addRelation('route');
});
Network.prototype.getCssClass = function getCssClass() {
	return "network_"+this.getCode();
}
export default Network;