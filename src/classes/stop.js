Thing = require('./thing');
function Stop() {
	Thing.apply(this, arguments);
	this.addRelation('platform');
	this.addRelation({
		singular: 'externalInterchange',
		symmetrical: true,
	});
}
Thing.extend(Stop);
Stop.prototype.getLink = function getLink() {
	return "/stop/"+this.getField('network').getId()+"/"+this.getField('code');
}
Stop.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	output.network = output.network.getId();
	return output;
}
module.exports = Stop;