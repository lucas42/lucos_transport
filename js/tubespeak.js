"use strict"
window.lucos.waitFor('ready', function _tubespeakloader() {

// Don't use for now.
return;
	var lines, ii, ll, train, states, status, overview, overviewNode, maxstate = {lines: 0, name: 'nError'}, gotline;
	if (
lucos.detect.isLite()) return;
	
	// HACK: Do one speak to make sure everything is loaded (and because the first calls seems to trigger an error)
	speak('');
	
	lines = document.querySelectorAll('.line');
	ll=lines.length;
	if (ll > 0) {
		states = {};
		for (ii=0;  ii<ll; ii++){
			(function _parseLine(line) {
				var linename = line.getAttribute("data-line");
				var status = line.getAttribute("data-status");
				var details = line.getAttribute("data-details")
							.replace('hrs', 'hours')
							.replace(/(0(\d)|(\d{2}))(\d{2})/, '$2 $3 $4'); // replace 4 digit times with something a bit more readable
				var divs, divi, divl;
				divs = line.querySelectorAll(".status, .details");
				for (divi=0, divl=divs.length; divi<divl; divi++) {
					divs[divi].addEventListener("click", function () {
						speak(linename+" Line.  "+status+".  "+details);
					}, false);
				}
				if (!(status in states)) {
					states[status] = [];
				}
				states[status].push(linename);
			})(lines[ii]);
		}
		
		// Work out which state is the most common, and don't read out all the lines in this state
		for (status in states) {
			if (states[status].length > maxstate.lines) {
				maxstate = {lines: states[status].length, name: status}
			}
		}
		overview = "";
		gotline = false;
		for (status in states) {
			if (status == maxstate.name) continue;
			overview += "There "+((status[status.length-1] == 's')?"are ":"is a ")+status+" on the ";
			ll=states[status].length;
			for (ii=0;  ii<ll; ii++) {
				if (ii > 0) {
					if (ii == ll-1) overview += " and ";
					else overview += ", ";
				}
				if (states[status][ii] == "Overground" && ll == 1) overview += "London ";
				overview += states[status][ii];
			}
			if (ll == 1 && (states[status][0] == "DLR" || states[status][0] == "Overground" )) {
				overview += ".  ";
			} else {
				gotline = true;
				overview += (ll > 1) ? " lines.  " : " line.  ";
			}
		}
		overview += "There "+((maxstate.name[maxstate.name.length-1] == 's')?"are ":"is a ")+maxstate.name+" on all "+((gotline)?"other ":"")+"London Underground lines.  ";
		overviewNode = document.createElement('div');
		overviewNode.appendChild(document.createTextNode('Overview'));
		overviewNode.setAttribute("class","overview");
		overviewNode.addEventListener('click', function () {
			speak(overview);
		}, false);
		document.body.insertBefore(overviewNode, document.body.firstChild);
	}
	
	train = document.querySelector("#train");

	if (train) {
		train.addEventListener("click", function _clickontrain() {
			var ii, ll;
			var line = this.getAttribute("data-line");
			var destination = this.getAttribute("data-destination");
			var nextstation = this.getAttribute("data-nextstation");
			var station = lucos.bootdata.stations[this.getAttribute("data-nextstationcode")] || {};
			var nexttime = this.getAttribute("data-nexttime");
			var atstation = (nexttime == 0);
			
			var currenttext = (function _getCurrentText() {
				var traintext = (destination == "Unknown" || destination == line + " Line" || destination == line + " Train") ? "This is a "+line+" line train.  Check the front of train for destination." : "This is a "+line+" line train to "+destination+".";
				var landmarks = "";
				if (station.landmarks) {
					ll=station.landmarks.length; 
					for (ii=0; ii<ll; ii++) {
						if (ii==0) landmarks += (atstation) ? "Alight for " : "Alight here for ";
						else if (ii == ll-1) landmarks += " and ";
						else landmarks += ", ";
						landmarks += station.landmarks[ii];
					}
					if (ll > 0) landmarks += ".  ";
					
				}
				if (destination == "Out Of Service") return "This train is currentlyy out of service.";
				if (destination == nextstation) {
					if (atstation) return "This is "+destination+", where this train terminates.  "+landmarks+"All Change please.  ";
					return "This is a "+line+" line train.  The next stop is "+nextstation+", where this train terminates.  "+landmarks
				}
				if (atstation) return "This is "+nextstation+".  "+landmarks+traintext;
				return traintext+"  The next stop is "+nextstation+".  "+landmarks;
			})();
			
			// Fix a few pronounciation things
			currenttext = currenttext
				.replace('via', 'viaa')
				.replace("CX", "Charing Cross");
				
			speak(currenttext);
		}, false);
	}
	
});

function speak(text) {
	lucos.speak(text);
	console.log("SPEAK:",text);
}
