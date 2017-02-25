var Class = require('./class');
var Stop = Class("Stop", ["network", "code"], function () {
	this.addRelation({
		singular: 'platform',
		sort: platformSort,
	});
	this.addRelation({
		singular: 'externalInterchange',
		symmetrical: true,
	});
});
Stop.prototype.getLink = function getLink() {
	return "/stop/"+encodeURIComponent(this.getNetwork().getCode())+"/"+encodeURIComponent(this.getCode());
}
Stop.prototype.getCssClass = function getCssClass() {
	return "stop "+this.getNetwork().getCssClass();
}
Stop.prototype.getSimpleName = function getSimpleName() {
	return Stop.simplifyName(this.getField("title"));
}
Stop.prototype.getData = function getData(source) {
	var output = this.getRawData();
	output.link = this.getLink();
	output.network = this.getNetwork().getCode();
	output.hasExternalInterchanges = this.getExternalInterchanges().length > 0;
	output.symbol = this.getNetwork().getSymbol();
	output.cssClass = this.getCssClass();
	output.simpleName = this.getSimpleName();
	return output;
}
Stop.sort = function sortStops(a, b) {
	return a.getField("title") > b.getField("title") ? 1 : -1;
}
Stop.simplifyName = function simplifyName(name) {
	if (!name) return null;
	return name
		.replace(/\s*Platform.*/, '')
		.replace(/\s*Pier/, '')
		.replace(/\s*Rail Station/, '')
		.replace(/\s*Underground Station/, '')
		.replace(/\s*DLR Station/, '');
}

function platformSort(a, b) {
	var aval = parseInt(a.getName().replace(/\D/g, ''));
	var bval = parseInt(b.getName().replace(/\D/g, ''));
	return aval - bval;
}
module.exports = Stop;