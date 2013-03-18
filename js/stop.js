/**
 * The Stop Class
 *
 * @param linecode {String} The line the stop is on
 * @param setno  {String} The train which is due to stop at this stop
 * @param stationcode {String} The station where the stop will occur
 * @param [platform] {String} The platform in the station where the stop will occur (optional - if undefined, an average of all possible platforms will be taken)
 */
function stop(linecode, setno, stationcode, platform) {
	var element, timeTextNode, abstime, reltime, stationname, stationplatformname, stationplatformTextNode, destination, destinationTextNode, interchangeNode;
	function updateData(tubedata) {
		var ii, li, totaltime = 0, platforms = 0, platformname, newstationplatformname, newdestination;
		stationname = tubedata.stations[stationcode].n;
		
		// Go through all the stops and look for matches
		for (ii=0, li=tubedata.stops.length; ii<li; ii++) {
			if (tubedata.stops[ii].l != linecode || tubedata.stops[ii].t != setno || tubedata.stops[ii].s != stationcode) continue;
			if (platform != undefined && tubedata.stops[ii].p != platform) continue;
			platforms++;
			platformname = tubedata.stations[stationcode].p[tubedata.stops[ii].p];
			newdestination = tubedata.destinations[tubedata.stops[ii].d];
			totaltime += tubedata.stops[ii].i;
		}
		if (platforms !== 1) platformname = null;
		
		if (platformname == null) newstationplatformname = stationname;
		else newstationplatformname = stationname + ' - ' + platformname;
		
		if (newstationplatformname != stationplatformname) {
			if (stationplatformTextNode) stationplatformTextNode.nodeValue = newstationplatformname;
			stationplatformname = newstationplatformname;
		}
		
		if (newdestination != destination) {
			if (destinationTextNode) destinationTextNode.nodeValue = newdestination;
			destination = newdestination;
		}
	
		if (platforms < 1) abstime = null;
		else abstime = totaltime / platforms;
		updateRelTime();
		updateInterchanges(tubedata);
	}
	function updateRelTime() {
		function getRelTime() {
			if (abstime === null) return null;
			return abstime - require('lucosjs').getTime()/1000;
		}
		var newreltime, minsTo, secondsTo, parent, text;
		newreltime = getRelTime();
		if (newreltime === reltime) return;
		
		if (newreltime === null) {
			text = "unknown"
		} else if (newreltime < -30) {
			teardown();
			return;
		} else if (newreltime < -10) {
			if (platform === undefined) text = 'passed it';
			else text = 'missed it';
		} else if (newreltime < 1) {
			text = 'now';
		} else if (newreltime < 60) {
			text = Math.floor(newreltime) + ' secs';
		} else {
			minsTo = Math.floor(newreltime / 60);
			secondsTo = Math.floor(newreltime % 60);
			if (secondsTo < 10) secondsTo = ':0'+secondsTo;
			else secondsTo = ':'+secondsTo;
			text = minsTo+secondsTo+' mins';
		}
		timeTextNode.nodeValue = text;
		
		if (reltime >= 1 && newreltime < 1) {
			require('lucosjs').send("stopArrived", this);
		} else if (reltime >= 30 && newreltime < 30) {
			require('lucosjs').send("stopApproaching", this);
		}
		
		reltime = newreltime;
	}
	function updateInterchanges(tubedata) {
		var interchanges = [], symbols = [], externalinterchanges, ii, il, jj, jl, interchange;
		if (!interchangeNode) return;
		while (interchangeNode.firstChild) {
			interchangeNode.removeChild(interchangeNode.firstChild);
		}
		
		var station = tubedata.stations[stationcode];
		for (ii=0, il=station.l.length; ii<il; ii++) {
			if (station.l[ii] == linecode) continue;
			interchanges.push(
							  {
							  title: tubedata.lines[station.l[ii]],
							  type: "tube",
							  cssClass: tubedata.lines[station.l[ii]].replace(/[ &]/g, '')
							  }
							  );
		}
		externalinterchanges = getExternalInterchanges(stationcode);
		for (ii=0, il=externalinterchanges.length; ii<il; ii++) {
			if (externalinterchanges[ii].type == 'tube' && externalinterchanges[ii].code) {
				for (jj=0, jl=tubedata.stations[externalinterchanges[ii].code].l.length; jj<jl; jj++) {
					interchanges.push(
									  {
									  title: tubedata.lines[tubedata.stations[externalinterchanges[ii].code].l[jj]],
									  type: "tube",
									  cssClass: tubedata.lines[tubedata.stations[externalinterchanges[ii].code].l[jj]].replace(/[ &]/g, '')
									  }
									  );
				}
			} else if (externalinterchanges[ii].name == station.n && (externalinterchanges[ii].type in require("lucosjs").bootdata.symbols)) {
				symbols.push(
							 {
							 alt: externalinterchanges[ii].type,
							 src: require("lucosjs").bootdata.symbols[externalinterchanges[ii].type],
							 }
							 );
			} else {
				interchanges.push(
								  {
								  title: externalinterchanges[ii].name,
								  type: externalinterchanges[ii].type,
								  symbol: require("lucosjs").bootdata.symbols[externalinterchanges[ii].type],
								  }
								  );
			}
		}
		interchanges.sort(function _sortfunc(a, b) {
			if (a.type != b.type) {
				if (a.type == 'tube') return 1;
				if (b.type == 'tube') return -1;
				return a.type > b.type;
			} else {
				return a.title > b.title;
			}
		});
		for (ii=0, il=interchanges.length; ii<il; ii++) {
			interchange = document.createElement("li");
			interchange.appendChild(document.createTextNode(interchanges[ii].title));
			interchange.addClass(interchanges[ii].type);
			if (interchanges[ii].cssClass) interchange.addClass(interchanges[ii].cssClass);
			interchangeNode.appendChild(interchange);
		}
		if (interchanges.length) {
			element.addClass("interchange");
		} else {
			element.removeClass("interchange");
		}
	}
	function getEl() {
		return element;
	}
	function getTime() {
		return abstime;
	}
	function getDestination() {
		return destination;
	}
	function getStationName() {
		return stationname;
	}
	function teardown() {
		if (element.parentNode) element.parentNode.removeChild(element);
		require('lucosjs').pubsub.unlisten('newtubedata', updateData);
		require('lucosjs').pubsub.unlisten('updateTimes', updateRelTime);
	}
	(function populateDOM() {
		var timeNode, stationplatformNode, destinationNode, leftColNode, rightColNode;
		timeNode = document.createElement("a");
		timeNode.addClass("stoptime");
		timeTextNode = document.createTextNode("loading...");
		timeNode.appendChild(timeTextNode);
	 
	 if (platform === undefined) {
			element = document.createElement("li");
			element.addClass("stop");
			element.appendChild(timeNode);
			interchangeNode = document.createElement("ul");
			interchangeNode.addClass("interchanges");
			element.appendChild(interchangeNode);
			stationplatformTextNode = document.createTextNode("loading...");
			stationplatformNode = document.createElement("a");
			stationplatformNode.appendChild(document.createTextNode(" > "));
			stationplatformNode.appendChild(stationplatformTextNode);
			stationplatformNode.setAttribute("href", "/tube/"+stationcode);
			timeNode.setAttribute("href", "/tube/"+stationcode);
			element.appendChild(stationplatformNode);
		} else {
			element = document.createElement("tr");
			element.addClass("train");
			destinationTextNode = document.createTextNode("loading...");
			destinationNode = document.createElement("a");
			destinationNode.appendChild(destinationTextNode);
			leftColNode = document.createElement("td");
			leftColNode.appendChild(destinationNode);
			element.appendChild(leftColNode);
			rightColNode = document.createElement("td");
			rightColNode.appendChild(timeNode);
			destinationNode.setAttribute("href", "/tube/"+linecode+setno);
			timeNode.setAttribute("href", "/tube/"+linecode+setno);
			element.appendChild(rightColNode);
		}
		if (setno === 0) element.addClass("ghost");
	})();
	require('lucosjs').pubsub.listenExisting('newtubedata', updateData);
	require('lucosjs').pubsub.listen('updateTimes', updateRelTime);
	this.getEl = getEl;
	this.teardown = teardown;
	this.getTime = getTime;
	this.getDestination = getDestination;
	this.getStationName = getStationName;
}

exports.construct = stop;

function getExternalInterchanges(stationcode) {
	var set, output, jj, jl, ii, match, li;
	var interchanges = require('lucosjs').bootdata.interchanges;
	for (ii=0, li=interchanges.length; ii<li; ii++) {
		set = interchanges[ii];
		match = false;
		output = [];
		for (jj=0, jl=set.length; jj<jl; jj++) {
			if (set[jj].type == "tube" && set[jj].code == stationcode) {
				match = true;
			} else {
				output.push(set[jj]);
			}
		}
		if (match) return output;
	}
	return [];
}

exports.getInterchanges = getExternalInterchanges;

var timestimeout;
/**
 * Keep all departure times update-to-date (once a second)
 */
function updateTimes() {
	if (timestimeout) window.clearTimeout(timestimeout);
	require("lucosjs").send("updateTimes");
	timestimeout=setTimeout(updateTimes, 1000-(new Date(require("lucosjs").getTime())).getMilliseconds());
}

exports.updateTimes = updateTimes;
