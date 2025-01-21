import { listen, unlisten } from 'lucos_pubsub';

// Keep track of the announcment listeners, so we can easily remove them
var listeners = [];
function listenAll(type, callback) {
	listeners.push({
		type: type,
		callback: callback,
	});
	listen(type, callback);
}
function unlistenAll() {
	listeners.forEach(listener => {
		unlisten(listener.type, listener.callback);
	});
	listeners = [];
}
export function init(type, extraData, callback) {
	unlistenAll();

	listenAll('refreshComplete', function () {
		callback("Updated.");
	});

	switch(type) {
		case "Stop":
			listenAll('eventApproaching', function (data) {
				callback(getStopAnnouncement(data, false));
			});
			listenAll('eventArrived', function (data) {
				callback(getStopAnnouncement(data, true));
			});
			break;
		case "Vehicle":
			listenAll('eventApproaching', function (data) {
				callback("The next stop is "+fixStationName(data.stop.simpleName));
			});
			listenAll('eventArrived', function (data) {
				callback("This is "+fixStationName(data.stop.simpleName));
			});
			break;

		case 'RouteList':
			if (!extraData || !('routes' in extraData) || !(extraData.routes) || !extraData.routes.length) break;
			callback(getStatusSummary(extraData.routes));
			break;
	}
	function getStopAnnouncement(data, arrived) {
		var text;
		if (data.platform.simpleName) {
			text = "The "
			if (!arrived) text += "next ";
			text += data.vehicle.vehicleType+" at "+data.platform.simpleName;
		} else {
			if (arrived) {
				text = "This"
			} else {
				text = "The next " + data.vehicle.vehicleType;
			}
		}
		text += arrived ? " is " : " will be ";
		text += (data.vehicle.routeName.match(/^[aoeuiAOEUI]|^R[A-Z]/)) ? "an " : "a ";
		text += fixRouteName(data.vehicle.routeName)+" ";
		text += (!data.platform.simpleName && arrived) ? data.vehicle.vehicleType : "service";
		if (data.vehicle.simpleDestination) text += " to "+fixStationName(data.vehicle.simpleDestination);
		return text;
	}
	function getStatusSummary(routeData) {
		var text = "";

		// Organise lines based on state & network
		var states = {};
		var networkTotals = {};
		routeData.forEach(route => {
			if (!route.status) return;
			if (route.status == "Service Closed" || route.status == "Planned Closure") route.status = 'closed';
			if (!(route.status in states)) {
				states[route.status] = {
					count: 0,
					networks: {},
					networkcount: 0,
					statusAfter: (route.status == 'closed' || route.status.match(/Suspended$/)),
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
		var maxstate = {count: 0, name: 'nError', statusAfter: false};
		for (let status in states) {
			if (states[status].count > maxstate.count) {
				maxstate = {count: states[status].count, name: status, statusAfter: states[status].statusAfter}
			}
		}

		// If all no state has a count of more than 0, then there's no point proceeding
		if (maxstate.count == 0) {
			return "Unable to Retrieve Status Updates";
		}
		let midList = false;
		let midSentence = false;

		// Handle all the states which except the one with most routes
		for (let status in states) {
			if (status == maxstate.name) continue;
			let statusAfter = states[status].statusAfter;
			if (!statusAfter) {
				text += "There "+((status[status.length-1] == 's')?"are ":"is a ")+status+" on ";
				midSentence = true;
			}
			midList = false;
			let numRoutes = states[status].count;
			let numTubes = (states[status].networks.tube) ? states[status].networks.tube.length : 0;
			let hasNonTubeRoutes = (numTubes != numRoutes);
			let routeCount = 0;
			if (numTubes == 1 || (hasNonTubeRoutes && numTubes >= 1 && numTubes <= 3)) {
				text += midSentence ? "the " : "The " ;
				midSentence = true;
				listRoutes(states[status].networks.tube, numRoutes, " Line");
				if (!hasNonTubeRoutes && statusAfter) {
					text += (numTubes == 1) ? " is " : " are ";
					text += status;
				}
			} else if (numTubes) {
				text += midSentence ? "the " : "The " ;
				midSentence = true;
				listRoutes(states[status].networks.tube, numTubes);
				text += " Lines";
				if (statusAfter) {
					text += (numTubes == 1) ? " is " : " are ";
					text += status;
				}
				if (hasNonTubeRoutes) {
					if (statusAfter) {
						text += ".  The ";
					} else {
						text += ".  There "+((status[status.length-1] == 's')?"are also ":"is also a ")+status+" on ";
					}
					midList = false;
					routeCount = 0;
					numRoutes -= numTubes;
				}
			}
			for (let network in states[status].networks) {
				if (network == "tube") continue; // Already done tube, ignore.
				listRoutes(states[status].networks[network], numRoutes);
			}
			if (statusAfter  && hasNonTubeRoutes) {
				text += (routeCount == 1) ? " is " : " are ";
				text += status;
			}
			text += ".  ";
			midSentence = false;
			function listRoutes(routes, listLength, routeSuffix) {
				routes.forEach(route => {

					// Overgound should start with "the" if at the beginning of a list, but not mid-List
					if (!midList && route.network == 'overground') {
						text += midSentence ? "the " : "The " ;
						midSentence = true;
					}
					appendConjuction(routeCount, listLength);
					text += fixRouteName(route.name, route.network, !midSentence);
					if (routeSuffix) text += routeSuffix;
					midList = true;
					midSentence = true;
					routeCount++;
				});
			}
		}

		// Handle the state with the most routes
		if (!maxstate.statusAfter) {
			text += "There "+((maxstate.name[maxstate.name.length-1] == 's')?"are ":"is a ")+maxstate.name+" on ";
			midSentence = true;
		}
		midList = false;
		let numNetworks = states[maxstate.name].networkcount;
		let networkCount = 0;
		for (let network in states[maxstate.name].networks) {
			let numRoutes = states[maxstate.name].networks[network].length;
			appendConjuction(networkCount, numNetworks);
			if (networkTotals[network] == 1) {
				text += fixRouteName(states[maxstate.name].networks[network][0].name, network, !midSentence);
				midSentence = true;
			} else {
				if (numRoutes == networkTotals[network]) {
					text += midSentence ? "all " : "All " ;
					midSentence = true;
				} else {
					text += midSentence ? "other " : "Other " ;
					midSentence = true;
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
		if (maxstate.statusAfter) {
			text += (maxstate.count == 1) ? " is " : " are ";
			text += maxstate.name;
		}
		text += ".";
		midSentence = true;
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

	/**
	 * Make route names more pronouncable
	 */
	function fixRouteName(routename, network, captialise) {
		switch (network) {
			case 'dlr':
				return captialise ? "The DLR" : "the DLR";
			case 'tram':
				return "London Trams";
		}
		if (captialise) routename = routename.charAt(0).toUpperCase() + routename.slice(1);
		return routename
			.replace('Bakerloo', "Baykerloo");
	}
}
