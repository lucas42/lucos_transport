var Class = require('./class');
var Symbols = require('../../data/symbols.json');
var Network = Class('Network', 'code', function () {
	this.addRelation('route');
});
Network.prototype.getCssClass = function getCssClass() {
	return "network_"+this.getCode();
}
Network.prototype.getSymbol = function getSymbol() {

	// Returning false rather than undefined means in mustache templates it'll override any symbols defined by a parent element
	if (!(this.getCode() in Symbols)) return false;
	return Symbols[this.getCode()];
}
module.exports = Network;