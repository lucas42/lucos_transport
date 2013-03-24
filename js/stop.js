/**
 * The Stop Class
 *
 * @param linecode {String} The line the stop is on
 * @param setno  {String} The train which is due to stop at this stop
 * @param stationcode {String} The station where the stop will occur
 * @param [platform] {String} The platform in the station where the stop will occur (optional - if undefined, an average of all possible platforms will be taken)
 */
function stop(linecode, setno, stationcode, platform, setlessid) {
	var stop, element, timeTextNode, abstime, reltime, stationname, platformname, stationplatformname, linename, stationplatformTextNode, destination, destinationTextNode, interchangeNode, interchanges, symbolsNode;
	function updateData(tubedata) {
		var ii, li, totaltime = 0, timecount = 0, platforms = {}, platformlist = [], newplatformname, newstationplatformname, newdestination;
		stationname = tubedata.stations[stationcode].n;
		linename = tubedata.lines[linecode];
		
		if (setno) {
			
			// Go through all the stops and look for matches
			for (ii=0, li=tubedata.stops.length; ii<li; ii++) {
				if (tubedata.stops[ii].l != linecode || tubedata.stops[ii].t != setno || tubedata.stops[ii].s != stationcode) continue;
				if (platform != undefined && tubedata.stops[ii].p != platform) continue;
				platforms[tubedata.stops[ii].p] = true;
				newdestination = tubedata.destinations[tubedata.stops[ii].d];
				timecount++;
				totaltime += tubedata.stops[ii].i;
			}
		} else {
			platforms[tubedata.stops[setlessid].p] = true;
			newdestination = tubedata.destinations[tubedata.stops[setlessid].d];
			timecount = 1;
			totaltime = tubedata.stops[setlessid].i;
		}
		
		for (ii in platforms) {
			platformlist.push(tubedata.stations[stationcode].p[ii]);
		}
		newplatformname = platformlist.join(' or ');
		if (platformlist.length == 1) {
			newstationplatformname = stationname + ' - ' + newplatformname;
		} else {
			newstationplatformname = stationname;
		}
		
		platformname = newplatformname;
		
		if (newstationplatformname != stationplatformname) {
			if (stationplatformTextNode) stationplatformTextNode.nodeValue = newstationplatformname;
			stationplatformname = newstationplatformname;
		}
		
		if (newdestination != destination) {
			if (destinationTextNode) destinationTextNode.nodeValue = newdestination;
			destination = newdestination;
		}
	
		// If no platforms matched, then remove this stop
		if (platformlist.length < 1) {
			teardown();
			
		} else {
			abstime = totaltime / timecount;
			updateRelTime();
			updateInterchanges(tubedata);
		}
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
			if (isTrain()) text = 'passed it';
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
		if (reltime != newreltime) {
			timeTextNode.nodeValue = text;
			
			if (reltime >= 1 && newreltime < 1) {
				require('lucosjs').send("stopArrived", stop);
			} else if (reltime >= 30 && newreltime < 30) {
				require('lucosjs').send("stopApproaching", stop);
			}
			
			reltime = newreltime;
		}
	}
	function updateInterchanges(tubedata) {
		var newinterchanges = {}, newinterchangesarray = [], symbols = [], externalinterchanges, ii, il, jj, jl, interchange, symbolImg, key;
		if (!interchangeNode) return;
		
		var station = tubedata.stations[stationcode];
		
		// Go through all the lines served by this station and add them as interchanges
		for (ii=0, il=station.l.length; ii<il; ii++) {
			key = "tube:"+station.l[ii];
			newinterchanges[key] = {
							  title: tubedata.lines[station.l[ii]],
							  type: "tube",
							  cssClass: tubedata.lines[station.l[ii]].replace(/[ &]/g, '')
							  };
		}
		
		// Go through interchanges specified in data file and add them too
		externalinterchanges = getExternalInterchanges(stationcode);
		for (ii=0, il=externalinterchanges.length; ii<il; ii++) {
			key = externalinterchanges[ii].type + ":" + (externalinterchanges[ii].code?externalinterchanges[ii].code:externalinterchanges[ii].name);
			
			// If the interchange is with another tube station, then include all the lines from that
			if (externalinterchanges[ii].type == 'tube' && externalinterchanges[ii].code) {
				for (jj=0, jl=tubedata.stations[externalinterchanges[ii].code].l.length; jj<jl; jj++) {
					key = "tube:"+tubedata.stations[externalinterchanges[ii].code].l[jj];
					newinterchanges[key] = {
									  title: tubedata.lines[tubedata.stations[externalinterchanges[ii].code].l[jj]],
									  type: "tube",
									  cssClass: tubedata.lines[tubedata.stations[externalinterchanges[ii].code].l[jj]].replace(/[ &]/g, '')
									  };
				}
			} else {
				newinterchanges[key] = {
					title: externalinterchanges[ii].name,
					type: externalinterchanges[ii].type,
					symbol: require("lucosjs").bootdata.symbols[externalinterchanges[ii].type],
					stationmatches: (externalinterchanges[ii].name && stationsMatch(externalinterchanges[ii].name, station.n))
				};
			}
		}
		for (ii in newinterchanges) {
			
			// Don't include the current line as an interchange
			if (ii == "tube:"+linecode) continue;
			newinterchangesarray.push(newinterchanges[ii]);
			
			// For anything which has a symbol and matches the name of the current symbol, display the symbol next to the station name, rather than the interchange box
			if (newinterchanges[ii].stationmatches && newinterchanges[ii].symbol) {
				symbols.push({
							 alt: newinterchanges[ii].type,
							 src: newinterchanges[ii].symbol
				});
			}
		}
		newinterchangesarray.sort(function _sortfunc(a, b) {
								  
			// Make sure all the tube lines go at the top
			if (a.type != b.type) {
				if (a.type == 'tube') return -1;
				if (b.type == 'tube') return 1;
			}
								  
			// Following tube lines should go interchanges which match the station name (these are usually just displayed as a symbol, but the order affects announcements too)
			if (a.stationmatches != b.stationmatches) {
				return (a.stationmatches) ? -1 : 1;
			}
			return a.title > b.title;
		});
		
		if (!interchanges || JSON.stringify(newinterchangesarray) != JSON.stringify(interchanges)) {
			interchanges = newinterchangesarray;
			while (interchangeNode.firstChild) {
				interchangeNode.removeChild(interchangeNode.firstChild);
			}
			while (symbolsNode.firstChild) {
				symbolsNode.removeChild(symbolsNode.firstChild);
			}
			for (ii=0, il=interchanges.length; ii<il; ii++) {
				
				// Don't show things in the interchange box if they are to have their own symbol next to the station name
				if (interchanges[ii].stationmatches && interchanges[ii].symbol) continue;
				
				interchange = document.createElement("li");
				if (interchanges[ii].symbol) {
					symbolImg = document.createElement("img");
					symbolImg.addClass("symbol");
					symbolImg.src = interchanges[ii].symbol;
					symbolImg.setAttribute("alt", interchanges[ii].type);
					interchange.appendChild(symbolImg);
				}
				interchange.appendChild(document.createTextNode(interchanges[ii].title));
				interchange.addClass(interchanges[ii].type);
				if (interchanges[ii].cssClass) interchange.addClass(interchanges[ii].cssClass);
				interchangeNode.appendChild(interchange);
			}
			for (ii=0, il=symbols.length; ii<il; ii++) {
				symbolImg = document.createElement("img");
				symbolImg.addClass("symbol");
				symbolImg.src = symbols[ii].src;
				symbolImg.setAttribute("alt", symbols[ii].alt);
				symbolsNode.appendChild(symbolImg);
			}
			if (interchanges.length) {
				element.addClass("interchange");
			} else {
				element.removeClass("interchange");
			}
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
	function getStationCode() {
		return stationcode;
	}
	function getStationName() {
		return stationname;
	}
	function getPlatformName() {
		return platformname;
	}
	function getLineName() {
		return linename;
	}
	function isTrain() {
		return (platform === undefined);
	}
	function getInterchanges() {
		return interchanges;
	}
	/**
	 * Checks whether the current station matches the destination
	 */
	function isTerminus() {
		return stationsMatch(stationname, destination);
	}
	
	/*
	 * Takes 2 station names and tries to work out if they might be the same
	 *(Obviously this is really rough and station codes should be used where possible)
	 */
	function stationsMatch(a, b) {
		function normalise(stationname) {
			return stationname.replace(/via .*/, '')
			.replace(/[\+\&]/, "and")
			.replace(" Street ", " St ");
		}
		a = normalise(a);
		b = normalise(b);
		if (a.indexOf(b) > -1) return true;
		if (b.indexOf(a) > -1) return true;
		return false;
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
	 
	 if (isTrain()) {
			element = document.createElement("li");
			element.addClass("stop");
			element.appendChild(timeNode);
	 
			stationplatformTextNode = document.createTextNode("loading...");
			stationplatformNode = document.createElement("a");
			stationplatformNode.appendChild(document.createTextNode(" > "));
			stationplatformNode.appendChild(stationplatformTextNode);
			stationplatformNode.setAttribute("href", "/tube/"+stationcode);
			timeNode.setAttribute("href", "/tube/"+stationcode);
			element.appendChild(stationplatformNode);

			interchangeNode = document.createElement("ul");
			interchangeNode.addClass("interchanges");
			element.appendChild(interchangeNode);
			symbolsNode = document.createElement("div");
			symbolsNode.addClass("symbols");
			element.appendChild(symbolsNode);
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
	stop = this;
	require('lucosjs').pubsub.listenExisting('newtubedata', updateData);
	require('lucosjs').pubsub.listen('updateTimes', updateRelTime);
	this.getEl = getEl;
	this.teardown = teardown;
	this.getTime = getTime;
	this.getDestination = getDestination;
	this.getStationCode = getStationCode;
	this.getStationName = getStationName;
	this.getPlatformName = getPlatformName;
	this.getLineName = getLineName;
	this.isTrain = isTrain;
	this.isTerminus = isTerminus;
	this.getInterchanges = getInterchanges;
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
