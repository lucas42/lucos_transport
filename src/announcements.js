const speech = require("mespeak"),
	Pubsub = require('lucos_pubsub');

var queue = [];
var isSpeaking = false;
function speak(message) {
	if (!localStorage.getItem("enabled")) return;
	if (isSpeaking) {
		queue.push(message);
		return;
	}
	isSpeaking = true;
	speech.speak(message, {}, function doneSpeaking() {
		isSpeaking = false;
		if (queue.length) {
			speak(queue.shift());
		}
	});
}

// Setup voice module
speech.loadConfig(require("mespeak/src/mespeak_config.json"));
speech.loadVoice(require("mespeak/voices/en/en-rp.json"));

module.exports = {
	enable: function () {
		localStorage.setItem("enabled", true);
	},
	disable: function () {
		localStorage.removeItem("enabled");
	},
	isEnabled: function () {
		return !!localStorage.getItem("enabled");
	}
}




Pubsub.listen('refreshComplete', function () {
	speak("Updated.");
});

switch(document.body.dataset.classtype) {
	case "Stop":
		Pubsub.listen('eventApproaching', function (data) {
			if (document.body.dataset.classid != data.stop.classID) return;
			var text = "The next "+data.vehicle.vehicleType+" at "+data.platform.simpleName+" will be ";
			text += (data.vehicle.routeName.charAt(0).match(/[aoeui]/)) ? "an " : "a ";
			text += data.vehicle.routeName+" "+data.vehicle.vehicleType;
			if (data.vehicle.simpleDestination) text += " to "+fixStationName(data.vehicle.simpleDestination);
			speak(text);
		});
		Pubsub.listen('eventArrived', function (data) {
			if (document.body.dataset.classid != data.stop.classID) return;
			var text = "The "+data.vehicle.vehicleType+" at "+data.platform.simpleName+" is ";
			text += (data.vehicle.routeName.charAt(0).match(/[aoeui]/)) ? "an " : "a ";
			text += data.vehicle.routeName+" "+data.vehicle.vehicleType;
			if (data.vehicle.simpleDestination) text += " to "+fixStationName(data.vehicle.simpleDestination);
			speak(text);
		});
		break;
	case "Vehicle":
		Pubsub.listen('eventApproaching', function (data) {
			if (document.body.dataset.classid != data.vehicle.classID) return;
			speak("The next stop is "+fixStationName(data.stop.simpleName));
		});
		Pubsub.listen('eventArrived', function (data) {
			if (document.body.dataset.classid != data.vehicle.classID) return;
			speak("This is "+fixStationName(data.stop.simpleName));
		});
		break;

	case 'RouteList':
		if (typeof routeData === "undefined" || !routeData.length) break;
		speak(getStatusSummary(routeData));
		break;
}
function getStatusSummary(routeData) {
	var text = "";

	// Organise lines based on state & network
	var states = {};
	var networkTotals = {};
	routeData.forEach(route => {
		if (!route.status) return;
		if (!(route.status in states)) {
			states[route.status] = {
				count: 0,
				networks: {},
				networkcount: 0,
			}
		}
		if (!(route.network in states[route.status].networks)) {
			states[route.status].networks[route.network] = [];
			states[route.status].networkcount++;
		}
		states[route.status].networks[route.network].push(route);
		states[route.status].count++;
		if (!(route.network in networkTotals)) {
			networkTotals[route.network] = 0;
		}
		networkTotals[route.network]++;
	});

	// Work out which state is the most common, and don't read out all the lines in this state
	var maxstate = {count: 0, name: 'nError'};
	for (let status in states) {
		if (states[status].count > maxstate.count) {
			maxstate = {count: states[status].length, name: status}
		}
	}
	let midList = false;

	// Handle all the states which except the one with most routes
	for (let status in states) {
		if (status == maxstate.name) continue;
		text += "There "+((status[status.length-1] == 's')?"are ":"is a ")+status+" on ";
		midList = false;
		let numRoutes = states[status].count;
		let numTubes = (states[status].networks.tube) ? states[status].networks.tube.length : 0;
		let hasNonTubeRoutes = (numTubes != numRoutes);
		let routeCount = 0;
		if (numTubes == 1 || (hasNonTubeRoutes && numTubes >= 1 && numTubes <= 3)) {
			text += "the ";
			listRoutes(states[status].networks.tube, numRoutes);
		} else if (numTubes) {
			text += "the ";
			listRoutes(states[status].networks.tube, numTubes);
			text += " Lines";
			if (hasNonTubeRoutes) {
				text += ".  There "+((status[status.length-1] == 's')?"are also ":"is also a ")+status+" on ";
				midList = false;
			}
		}
		for (let network in states[status].networks) {
			if (network == "tube") continue; // Already done tube, ignore.
			appendConjuction(routeCount, numRoutes); // Extra conjunction to handle tricky cases with "the"
			if (network == "dlr" || network == "overground") {
				text += "the ";
			}
			listRoutes(states[status].networks[network], numRoutes);
		}
		text += ".  ";
		function listRoutes(routes, listLength) {
			routes.forEach(route => {
				appendConjuction(routeCount, listLength);
				if (route.name == "Overground" && listLength == 1) text += "London ";
				text += route.name;
				midList = true;
				routeCount++;
			});
		}
	}

	// Handle the state with the most routes
	text += "There "+((maxstate.name[maxstate.name.length-1] == 's')?"are ":"is a ")+maxstate.name+" on ";
	midList = false;
	let numNetworks = states[maxstate.name].networkcount;
	let networkCount = 0;
	for (let network in states[maxstate.name].networks) {
		let numRoutes = states[maxstate.name].networks[network].length;
		appendConjuction(networkCount, numNetworks);
		if (networkTotals[network] == 1) {
			text += "the " + network;
		} else {
			if (numRoutes == networkTotals[network]) {
				text += "all ";
			} else {
				text += "other ";
			}
			if (network == 'tube') {
				text += "London Underground Lines";
			} else if (network == 'river-bus') {
				text += "River Bus Services";
			} else {
				text += network + " Routes";
			}
		}
		midList = true;
		networkCount++;
	}
	text += ".";
	return text;
	function appendConjuction(currentIndex, listLength) {

		// If we're at the start of the list, then don't need a conjunction
		if (!midList) return;
		if (currentIndex == listLength - 1) text += " and ";
		else text += ", ";
		// We won't need another conjunction until another item is added to list
		midList = false;
	}
}

/**
 * Substitues certain strings used in Station Names with something more pronouncable
 * @param name {String} The Name of a station, or a destination
 */
function fixStationName(name) {
	if (!name) return 
	return name
	.replace("via T4 Loop", "Terminal 4")
	.replace("1-2-3", "1, 2 and 3")
	.replace("123 + 5", "1, 2, 3 and 5")
	.replace("CX", "Charing Cross")
	.replace("Arsn", "Arsenal")
	.replace(" St ", " Street ")
	.replace("Southwark", "Suthirck")
	.replace("Fulham", "Fullam")
	.replace(/int$/i, "International")
	.replace(/\(.*\)/, "");
}
