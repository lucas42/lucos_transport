var network = function (element) {
	var lines = null;
	
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
			render();
		}
	}
	
	function render() {
		element.innerHTML = require('lucosjs').render('lines', {lines: lines});
		require('lucosjs').addNavBar("Tube");
	}
	require('lucosjs').pubsub.listenExisting('newtubedata', updateData);
	function teardown() {
		require('lucosjs').pubsub.unlisten('newtubedata', updateData);
	}
	this.teardown = teardown;
};

exports.construct = network;