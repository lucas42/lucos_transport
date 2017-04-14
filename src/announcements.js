const speech = require("mespeak"),
	Pubsub = require('lucos_pubsub');

function speak(message) {
	if (!localStorage.getItem("enabled")) return;
	speech.speak(message);
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
			speak("The next vehicle arriving at "+data.platform.name+" is for "+data.vehicle.simpleDestination);
		});
		break;
	case "Vehicle":
		Pubsub.listen('eventApproaching', function (data) {
			if (document.body.dataset.classid != data.vehicle.classID) return;
			speak("The next stop is "+data.stop.simpleName);
		});
		break;
}

