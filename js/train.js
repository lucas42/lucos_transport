
var lucos = require('lucosjs');
function train(linecode, setno, element) {
	var linename, stops = {}, stopsDOMList, destination, destinationTextNode, continuesNode;
	function updateData(tubedata) {
		var ii, li, newlinename, stopkey, prevstopel, stopsArray, stop, newdestination;
		newlinename = tubedata.lines[linecode];
		
		// Go through each of the existing stops and mark them all as not current
		for (stopkey in stops) {
			stops[stopkey].current = false;
		}
		
		// Iterate through the stops in the tube data which are applicable to this train.
		for (ii=0, li=tubedata.stops.length; ii<li; ii++) {
			if (tubedata.stops[ii].l != linecode || tubedata.stops[ii].t != setno) continue;
			stopkey = tubedata.stops[ii].l + "_" + tubedata.stops[ii].t  + "_" + tubedata.stops[ii].s;
			
			// If a stop isn't already in the stops list, then add it
			if (!(stopkey in stops)) {
				stops[stopkey] = new (require('stopjs').construct)(tubedata.stops[ii].l, tubedata.stops[ii].t, tubedata.stops[ii].s);
			}
			stops[stopkey].current = true;
		}
		
		// Stops are canonically stored in an object to avoid duplication, but copy them to any array for sorting
		stopsArray  = [];
		for (stopkey in stops) {
			if (!stops[stopkey].current) {
				stops[stopkey].teardown();
				delete stops[stopkey];
			} else {
				stopsArray.push(stops[stopkey]);
			}
		}
		stopsArray.sort(function (a, b) {
			return a.getTime() - b.getTime();
		});
		
		// Update the DOM to reflect any changes in stops
		for (ii=0, li=stopsArray.length; ii<li; ii++) {
			stop = stopsArray[ii];
			
			// NB: This assumes that the existing DOM Nodes are in the correct order, it doesn't reorder stops already in the DOM
			if (!stop.inDOM) {
				if (prevstopel) {
					stopsDOMList.insertBefore(stop.getEl(), prevstopel.nextSibling);
				} else {
					stopsDOMList.insertBefore(stop.getEl(), stopsDOMList.firstChild);
				}
				stop.inDOM = true;
			}
			prevstopel = stop.getEl();
		}
		if (stopsArray.length) newdestination = stopsArray[0].getDestination();
		else newdestination = "nowhere";
		
		if (destination != newdestination) {
			destination = newdestination;
			destinationTextNode.nodeValue = destination;
		}
		
		// If the last station is not the destination, then display an arrow at the bottom of list
		continues = false;
		if (stopsArray.length) {
			
			var laststationname = stopsArray[stopsArray.length-1].getStationName().replace(/\(.*\)/, '').replace(/[\+\&]/, "and");
			var norm_destination = destination.replace(/via .*/, '').replace(/[\+\&]/, "and");
			if (norm_destination.indexOf(laststationname) == -1 && laststationname.indexOf(norm_destination) == -1) continues = true;
		}
		if (!continues && continuesNode) {
			stopsDOMList.removeChild(continuesNode);
			continuesNode = null;
		}
		if (continues && !continuesNode) {
			continuesNode = document.createElement('li');
			continuesNode.addClass("continues");
			stopsDOMList.appendChild(continuesNode);
		}
		
		// If the line changes name, then re-render everything (this seems unlikely to happen that often, but just in case)
		if (!linename || linename != newlinename) {
			linename = newlinename;
			render();
		}
	}
	
	
	function render() {
		document.body.addClass("nofooter");
		var renderdata = {
			linename: linename,
			linelink: '/tube/'+encodeURIComponent(linename),
			set: setno,
			cssClass: linename.replace(/[ &]/g, '')
		};
/*	
		
		// Interate through all the stops other than first and last to look for adjacent interchanges
		// First and last stops won't have interchanges removed, which could lead to inconsistentcies as the first/last stop changes
		for (ii=1, li=renderdata.stops.length-1; ii<li; ii++) {
			for (jj=0, jl=renderdata.stops[ii].interchanges.length; jj<jl; jj++) {
				var interchange_at_prev_station = false;
				for (kk=0, kl=renderdata.stops[ii-1].interchanges.length; kk<kl; kk++) {
					if (renderdata.stops[ii].interchanges[jj].type != renderdata.stops[ii-1].interchanges[kk].type) continue;
					if (renderdata.stops[ii].interchanges[jj].title != renderdata.stops[ii-1].interchanges[kk].title) continue;
					interchange_at_prev_station = true;
				}
				if (!interchange_at_prev_station) continue;
				var interchange_at_next_station = false;
				for (kk=0, kl=renderdata.stops[ii+1].interchanges.length; kk<kl; kk++) {
					if (renderdata.stops[ii].interchanges[jj].type != renderdata.stops[ii+1].interchanges[kk].type) continue;
					if (renderdata.stops[ii].interchanges[jj].title != renderdata.stops[ii+1].interchanges[kk].title) continue;
					interchange_at_next_station = true;
				}
				if (!interchange_at_next_station) continue;
				
				// Add ignore flag rather than remove from array, as that would cause issues for the next stop
				renderdata.stops[ii].interchanges[jj].ignore = true;
			}
		}*/
		
		require('linejs').setCurrent(renderdata.linename);
		lucos.addNavBar(renderdata.linename+" Line Train "+renderdata.set);
		element.innerHTML = lucos.render('train', renderdata);
		element.getElementsByClassName("journey")[0].appendChild(stopsDOMList);
		element.getElementsByClassName("destination")[0].appendChild(destinationTextNode);
	}
	stopsDOMList = document.createElement("ul");
	stopsDOMList.addClass("route");
	destinationTextNode = document.createTextNode(destination);
	lucos.pubsub.listenExisting('newtubedata', updateData);
	function teardown() {
		lucos.pubsub.unlisten('newtubedata', updateData);
		
		// Teardown all the stops
		for (stopkey in stops) {
			stops[stopkey].teardown();
			delete stops[stopkey];
		}
	}
	this.teardown = teardown;
	
}
exports.construct = train;

