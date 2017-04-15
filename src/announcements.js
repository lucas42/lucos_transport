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
