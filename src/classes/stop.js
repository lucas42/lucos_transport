import Class from './class.js';
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
	return "/tfl/stop/"+encodeURIComponent(this.getCode());
}
Stop.prototype.getCssClass = function getCssClass() {
	var cssClass = "stop ";
	if (this.getField("mode")) {
		cssClass += "mode_"+this.getField("mode")+" ";
	}
	cssClass += this.getNetwork().getCssClass();
	return cssClass;
}
Stop.prototype.getSimpleName = function getSimpleName() {
	return Stop.simplifyName(this.getField("title"));
}
Stop.prototype.getData = function getData(source) {
	var output = this.getRawData();
	output.link = this.getLink();
	output.network = this.getNetwork().getCode();
	output.hasExternalInterchanges = this.getExternalInterchanges().length > 0;
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
		.replace(/\.$/,'')
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
		var num = platform.getName().match(/\b\d+/g);
		if (!num) return Infinity;
		return parseInt(num[0]);
	}
	if (!a.getName()) return 1;
	if (!b.getName()) return -1;
	const modePriority = ['tube','dlr','elizabeth','overground','tram','river-bus','bus'];
	var modea = a.getField("mode");
	var modeb = b.getField("mode");
	var aval = platformNum(a);
	var bval = platformNum(b);
	if (aval != bval) return aval - bval;
	if (modea != modeb) {
		for (var mode in modePriority) {
			if (modea == modePriority[mode]) return -1;
			if (modeb == modePriority[mode]) return 1;
		}
	}
	return (a.getFullName() > b.getFullName()) ? 1 : -1;
}
export default Stop;