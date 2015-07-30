Thing = require('./thing');
function Vehicle() {
	Thing.apply(this, arguments);
	this.addRelation('event');
}
Thing.extend(Vehicle);

Vehicle.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/vehicle/"+this.getId();
	return output;
}
module.exports = Vehicle;