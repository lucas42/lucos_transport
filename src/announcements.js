const speech = require("mespeak"),
	Pubsub = require('lucos_pubsub');

function speak(message) {
	if (!localStorage.getItem("enabled")) return;
	speech.speak(message);
}

// Setup voice module
speech.loadConfig(require("mespeak/src/mespeak_config.json"));
speech.loadVoice(require("mespeak/voices/en/en-rp.json"));

Pubsub.listen('refreshComplete', function () {
	speak("Updated.");
})


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