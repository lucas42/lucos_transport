Thing = require('./thing');
function Stop() {
	Thing.apply(this, arguments);
	Thing.addRelation(this, 'platform');
}
Thing.extend(Stop);
Stop.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/stop/"+this.getId();
	return output;
}
module.exports = Stop;