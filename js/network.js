var network = function (networkid) {
	var lines = null;
	var network = this;
	
	function updateData(tubedata) {
		var newlines = [], linedata;
		for (code in tubedata.lines) {
			linedata = {
			name: tubedata.lines[code],
			link: '/tube/'+encodeURIComponent(tubedata.lines[code]),
			cssClass: tubedata.lines[code].replace(/[ &]/g, ''),
			};
			if (typeof tubedata.status[code] == 'object') {
				linedata.status = tubedata.status[code].status;
				linedata.details = tubedata.status[code].details;
			}
			newlines.push(linedata);
		}
		if (!lines || JSON.stringify(lines) != JSON.stringify(newlines)) {
			lines = newlines;
			require('lucosjs').send('networkStatusChanged', network);
		}
	}
	
	function getId() {
		return networkid;
	}
	function getLines() {
		return lines;
	}
	require('lucosjs').pubsub.listenExisting('newtubedata', updateData);
	function teardown() {
		require('lucosjs').pubsub.unlisten('newtubedata', updateData);
	}
	this.teardown = teardown;
	this.getId = getId;
	this.getLines = getLines;
};

exports.construct = network;

var networkView = function (networkid, element) {
	
	function render(network) {
		if (network.getId() != networkid) return;
		element.innerHTML = require('lucosjs').render('lines', {lines: network.getLines()});
		require('lucosjs').addNavBar("Tube");
	}
	require('lucosjs').pubsub.listenExisting('networkStatusChanged', render);
	function teardown() {
		require('lucosjs').pubsub.unlisten('networkStatusChanged', render);
	}
	this.teardown = teardown;
}

exports.view = networkView;