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
		.replace(/\s*DLR Station/, '')

		// Usually brackets can be ignored.  
		// Except in the case of Olympia where the most important bit of the name is in brackets
		.replace(/\s*\((?!Olympia).*\)/, '');
}

function platformSort(a, b) {
	function platformNum(platform) {
		var name = platform.getName();
		if (!name) return Infinity;
		var num = name.replace(/\D/g, '');
		if (!num) return Infinity;
		return parseInt(num);
	}
	var aval = platformNum(a);
	var bval = platformNum(b);
	return aval - bval;
}
module.exports = Stop;