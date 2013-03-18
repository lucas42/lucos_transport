var line = function (linecode, element) {
	var name, stations;
	
	function updateData(tubedata) {
		var stationcode;
		var newstations = [];
		var newname;
		newname = tubedata.lines[linecode];
		for (stationcode in tubedata.stations) {
			if (tubedata.stations[stationcode].l.indexOf(linecode) == -1) continue;
			newstations.push({
				 name: tubedata.stations[stationcode].n || "Unknown",
				 link: '/tube/'+stationcode
			 });
		}
		newstations.sort(function (a, b) {
			return a.name > b.name ? 1 : -1;
		});
		
		// Only re-render if something has changed
		if (!name || !stations || name != newname || JSON.stringify(stations) != JSON.stringify(newstations)) {
			name = newname;
			stations = newstations;
			render();
		}
	}
	
	function render() {
		var renderdata = {
			name: name,
			cssClass: name.replace(/[ &]/g, ''),
			stations: stations
		};
		setCurrent(name);
		require('lucosjs').addNavBar(name+" Line Stations");
		element.innerHTML = require('lucosjs').render('line', renderdata);
	}
	require('lucosjs').pubsub.listenExisting('newtubedata', updateData);
	function teardown() {
		require('lucosjs').pubsub.unlisten('newtubedata', updateData);
		setCurrent(null);
	}
	this.teardown = teardown;
};

exports.construct = line;
function setCurrent(linename) {
	var cssClass = window.document.body.getAttribute('class') || '';
	cssClass = cssClass.replace(/ *line_[A-Z]+ */ig, ' ');
	if (linename) cssClass += ' line_'+linename.replace(/[ &]/g, '').toLowerCase();
	window.document.body.setAttribute('class', cssClass);
}

exports.setCurrent = setCurrent;