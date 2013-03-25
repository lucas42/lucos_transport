"use strict"
var lucos = require('lucosjs');
lucos.waitFor('ready', function _tubespeakloader() {
			  var speechcontrol = document.createElement("div").addClass("speechcontrol");
			  speechcontrol.appendChild(document.createTextNode("Announcements: "));
			  speechcontrol.appendChild(lucos.speech.getButton());
				document.body.insertBefore(speechcontrol, document.getElementById('footer'));
			  });

// This function is no longer used, but contains some logic for speech stuff still to be implemented
function oldspeechstuff() {
	var lines, ii, ll, train, states, status, overview, overviewNode, maxstate = {lines: 0, name: 'nError'}, gotline;
	
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
	
};

function speak(text) {
	window.setTimeout(function () {
		lucos.speech.send(text);
	}, 0);
	console.log("SPEAK:",text);
}

lucos.listen("stopApproaching", function _approaching(stop) {
	stop.makeAnnouncement(false);
});
lucos.listen("stopArrived", function _approaching(stop) {
	stop.makeAnnouncement(true);
});

lucos.pubsub.listenExisting('networkStatusChanged', function _networkStats(network) {
	network.makeAnnouncement();
});

var Network = require('networkjs').construct;
Network.prototype.makeAnnouncement = function (){
	var lines, ii, ll, states, status, overview, maxstate, gotline;
	lines = this.getLines();
	ll=lines.length;
	if (ll < 1) return;
	// Organise lines based on state
	states = {};
	for (ii=0;  ii<ll; ii++){
		status = lines[ii].status;
		if (!(status in states)) {
			states[status] = [];
		}
		states[status].push(lines[ii]);
	}
	
	// Work out which state is the most common, and don't read out all the lines in this state
	maxstate = {lines: 0, name: 'nError'};
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
			if (states[status][ii].name == "Overground" && ll == 1) overview += "London ";
			overview += states[status][ii].name;
		}
		if (ll == 1 && (states[status][0].name == "DLR" || states[status][0].name == "Overground" )) {
			overview += ".  ";
		} else {
			gotline = true;
			overview += (ll > 1) ? " lines.  " : " line.  ";
		}
	}
	overview += "There "+((maxstate.name[maxstate.name.length-1] == 's')?"are ":"is a ")+maxstate.name+" on all "+((gotline)?"other ":"")+"London Underground lines.  ";
	speak(overview);
}

/**
 * Substitues certain strings used in Station Names with something more pronouncable
 * @param name {String} The Name of a station, or a destination
 */
function fixStationName(name) {
	return name
	.replace("via T4 Loop", "Terminal 4")
	.replace("123 + 5", "1, 2, 3 and 5")
	//.replace('via', 'viaa')
	.replace("CX", "Charing Cross")
	.replace("Arsn", "Arsenal")
	.replace(" St ", " Street ")
	.replace(/\(.*\)/, "");
}

var Stop = require('stopjs').construct;
Stop.prototype.getSpeakableStationName = function () {
	return fixStationName(this.getStationName());
}
Stop.prototype.getSpeakableDestination = function () {
	return fixStationName(this.getDestination());
}
Stop.prototype.getSpeakablePlatformName = function () {
	var platform = this.getPlatformName();
	if (!platform) {
		var station = this.getStationName();
		debugger;
	}
	if (platform === null) return "some platform";
	return platform.replace(/.* - /, '');
}
Stop.prototype.getInterchangeAnnouncement = function(atstation) {
	var output, ii, ll, interchanges = this.getInterchanges(), titles, stationmatches, structured = {}, type, plural, typelength, typecount;
	ll=interchanges.length;
	if (!ll) return "";
	if (atstation) output = "Change here for ";
	else output = "Change for ";
	typelength = 0;
	for (ii=0; ii<ll; ii++) {
		if (!structured[interchanges[ii].type]) {
			structured[interchanges[ii].type] = [];
			typelength++;
		}
		structured[interchanges[ii].type].push(interchanges[ii]);
	}
	
	typecount = 0;
	for (type in structured) {
		typecount++;
		ll = structured[type].length;
		if (!ll) continue;
		stationmatches = false;
		plural = ll > 1;
		titles = "";
		for (ii=0; ii<ll; ii++) {
			if (structured[type][ii].stationmatches && (type == 'nr' || type == 'river')) {
				stationmatches = true;
			} else {
				titles += structured[type][ii].title;
				if (ii == ll-1) {
				} else if (ii == ll-2) {
					titles += " and ";
				} else {
					titles += ", ";
				}
			}
		}
		switch (type) {
			case "tube":
				output += "the " + titles + " line";
				if (plural) output += "s";
				break;
			case "nr":
				output += "National Rail Services";
				if (titles && stationmatches) output += " from here and also " + titles;
				else if (titles) output += " from " + titles;
				break;
			case "river":
				output += "River Boat Services";
				if (titles && stationmatches) output += " from here and also " + titles;
				else if (titles) output += " from " + titles;
				break;
			case "dlr":
				output += "Docklands Light Railway";
				break;
			case "overground":
				output += "London Overground";
				break;
			case "buses":
				output += titles + " Bus Station";
				if (plural) output += "s";
				break;
			case "coaches":
				output += titles + " Coach Station";
				if (plural) output += "s";
				break;
			case "airport":
				if (interchanges[ii].titles.toLowerCase().indexOf('airport') > -1) {
					output += titles;
				} else {
					output += title + " Airport";
					if (plural) output += "s";
				}
			default:
				output += "something else";
		}
		if (typelength == typecount) {
			output += ".  ";
		} else if (typecount == typelength-1) {
			output += " and ";
		} else {
			output += ", ";
		}
	}
	return output;
}
Stop.prototype.getLandmarkAnnonucement = function(atstation) {
	var station, landmarks, ll, ii, stationcode = this.getStationCode();
	var station = lucos.bootdata.stations[stationcode] || {};
	var landmarks = "";
	if (station.landmarks) {
		for (ii=0, ll=station.landmarks.length; ii<ll; ii++) {
			if (ii==0) landmarks += (atstation) ? "Alight for " : "Alight here for ";
			else if (ii == ll-1) landmarks += " and ";
			else landmarks += ", ";
			landmarks += station.landmarks[ii];
		}
		if (ll > 0) landmarks += ".  ";
		
	}
	return landmarks;
}
Stop.prototype.getTerminusAnnouncement = function () {
	if (this.isTerminus()) {
			return ", where this train terminates";
	} else {
			return "";
	}
}
Stop.prototype.getTrainServiceName = function () {
	var line = this.getLineName();
	if (line == 'DLR') return "a DLR train";
	
	// HACK:  None of the current Underground lines start with a vowel, so always use 'a'
	return "a " + line + " line train";
}
Stop.prototype.makeAnnouncement = function (atstation) {
	var subject, verb;
	if (this.isTrain()) {
		if (stop.getDestination() == "Out Of Service") {
			speak("This train is currently out of service.");
		} else {
			subject = atstation ? "This" : "The next stop";
			speak(subject+" is "+this.getSpeakableStationName()+this.getTerminusAnnouncement()+".  "+this.getInterchangeAnnouncement(atstation)+this.getLandmarkAnnonucement(atstation));
		}
	} else {
		subject = atstation ? "The train" : "The next train";
		verb = atstation ? "is" : "will be";
		speak(subject+" at "+this.getSpeakablePlatformName()+" "+verb+" "+this.getTrainServiceName()+" to "+this.getSpeakableDestination());
		
	}
}
