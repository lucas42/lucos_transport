"strict";
var lucos = require('lucosjs');
function station (stationcode, element, connectedstation) {
	var name, platforms = {}, platformDOMLists = {}, stops = {}, stopsDOMLists = {}, platformLines = {}, platformCssClasses = {}, interchanges = {};
	
	
	function updateData(tubedata) {
		var newname, newplatforms = [], platformkey, stopkey, stopsArray, prevstopel, classes, code, ii, li, newCssClass;
		var station = tubedata.stations[stationcode];
		
		newname = station.n;
		for (code in station.p) {
			newplatforms[code] = station.p[code]+(connectedstation ? " ("+newname+")":"");
		}
		if (!name || newname != name || JSON.stringify(platforms) != JSON.stringify(newplatforms)) {
			name = newname;
			platforms = newplatforms;
			render();
		}
		for (ii=0, ll=tubedata.stops.length; ii<ll; ii++) {
			if (tubedata.stops[ii].s != stationcode) continue;
			platformkey = tubedata.stops[ii].p;
			stopkey = tubedata.stops[ii].l + "_" + tubedata.stops[ii].t;
			if (!(platformkey in stops)) throw "Platform "+platformkey+" not found in station "+name;
			
			// If a stop isn't already in the stops list, then add it
			if (!(stopkey in stops[platformkey])) {
				stops[platformkey][stopkey] = new (require('stopjs').construct)(tubedata.stops[ii].l, tubedata.stops[ii].t, tubedata.stops[ii].s, tubedata.stops[ii].p);
			}
			stops[platformkey][stopkey].current = true;
			platformLines[platformkey][tubedata.stops[ii].l] = tubedata.lines[tubedata.stops[ii].l].replace(/[ &]/g, '').toLowerCase();
		}
		for (platformkey in stops) {
			
			// Stops are canonically stored in an object to avoid duplication, but copy them to any array for sorting
			stopsArray  = [];
			for (stopkey in stops[platformkey]) {
				if (!stops[platformkey][stopkey].current) {
					stops[platformkey][stopkey].teardown();
					delete stops[platformkey][stopkey];
				} else {
					stopsArray.push(stops[platformkey][stopkey]);
				}
			}
			stopsArray.sort(function (a, b) {
							return a.getTime() - b.getTime();
							});
			
			// Update the DOM to reflect any changes in stops
			prevstopel = null;
			for (ii=0, li=stopsArray.length; ii<li; ii++) {
				stop = stopsArray[ii];
				
				// NB: This assumes that the existing DOM Nodes are in the correct order, it doesn't reorder stops already in the DOM
				if (!stop.inDOM) {
					if (prevstopel) {
						stopsDOMLists[platformkey].insertBefore(stop.getEl(), prevstopel.nextSibling);
					} else {
						stopsDOMLists[platformkey].insertBefore(stop.getEl(), stopsDOMLists[platformkey].firstChild);
					}
					stop.inDOM = true;
				}
				prevstopel = stop.getEl();
			}
			
			// Update the platform's CSS class (based on which lines use it)
			classes = [];
			for (code in platformLines[platformkey]) {
				classes.push(platformLines[platformkey][code]);
			}
			if (classes.length) {
				classes.sort();
				newCssClass = classes.join('_');
			} else {
				newCssClass = "unused";
			}
			if (newCssClass != platformCssClasses[platformkey]) {
				platformDOMLists[platformkey].addClass(platformCssClasses[platformkey]);
				platformDOMLists[platformkey].addClass(newCssClass);
				platformCssClasses[platformkey] = newCssClass;
			}
		}
	}
	
	function render() {
		var renderdata, platformNodes, ii, il, platformid, interchangeset, interchangeNode;
		renderdata = {
			name: name,
			platforms: [],
			connected: !!connectedstation
		};
		for (ii in platforms) {
			renderdata.platforms.push({
				id: ii,
				name: platforms[ii]
			});
		}

		element.innerHTML = lucos.render('station', renderdata);
		
		platformDOMLists = {};
		stops = {};
		stopsDOMLists = {};
		platformNodes = element.getElementsByClassName("platform");
		for (ii=0, il=platformNodes.length; ii<il; ii++) {
			platformid = platformNodes[ii].getAttribute("data-platformid");
			platformDOMLists[platformid] = platformNodes[ii];
			stops[platformid] = {};
			stopsDOMLists[platformid] = platformNodes[ii].getElementsByTagName("tbody")[0];
			platformLines[platformid] = {};
		}
		if (!connectedstation) {
			lucos.addNavBar(name);
			interchangeset = require('stopjs').getInterchanges(stationcode);
			for (ii=0, li=interchangeset.length; ii<li; ii++) {
				if ((interchangeset[ii].type == 'tube' || interchangeset[ii].type == 'dlr') && interchangeset[ii].code) {
					interchangeNode = document.createElement("div");
					interchanges[interchangeset[ii].code] = new station(interchangeset[ii].code, interchangeNode, true);
					element.appendChild(interchangeNode)
				}
			}
		}
	}
	lucos.pubsub.listenExisting('newtubedata', updateData);
	function teardown() {
		var platformkey, stopkey, interchangekey;
		lucos.pubsub.unlisten('newtubedata', updateData);
		
		// Teardown all the stops
		for (platformkey in stops) {
			for (stopkey in stops[platformkey]) {
				stops[platformkey][stopkey].teardown();
				delete stops[platformkey][stopkey];
			}
			delete stops[platformkey];
		}
		
		// Teardown any interchanges
		for (interchangekey in interchanges) {
			interchanges[interchangekey].teardown();
		}
	}
	this.teardown = teardown;
}

exports.construct = station

