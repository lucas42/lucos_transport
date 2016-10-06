var Class = require('./class');
var Stop = Class("Stop", ["network", "code"], function () {
	this.addRelation('platform');
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
Stop.prototype.getData = function getData(source) {
	var output = this.getRawData();
	output.link = this.getLink();
	output.network = this.getNetwork().getCode();
	output.hasExternalInterchanges = this.getExternalInterchanges().length > 0;
	output.symbol = this.getNetwork().getSymbol();
	output.cssClass = this.getCssClass();
	return output;
}
Stop.sort = function sortStops(a, b) {
	return a.getField("title") > b.getField("title") ? 1 : -1;
}
module.exports = Stop;