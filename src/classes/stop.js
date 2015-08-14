var Class = require('./class');
var Stop = Class("Stop", ["network", "code"], function () {
	this.addRelation('platform');
	this.addRelation({
		singular: 'externalInterchange',
		symmetrical: true,
	});
});
Stop.prototype.getLink = function getLink() {
	return "/stop/"+this.getNetwork().getCode()+"/"+this.getCode();
}
Stop.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	output.network = this.getNetwork().getCode();
	return output;
}
module.exports = Stop;