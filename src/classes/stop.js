Thing = require('./thing');
function Stop() {
	Thing.apply(this, arguments);
	this.addRelation('platform');
}
Thing.extend(Stop);
Stop.prototype.getLink = function getLink() {
	return "/stop/"+this.getId();
}
Stop.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = this.getLink();
	return output;
}
module.exports = Stop;