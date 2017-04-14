const speech = require("mespeak"),
	Pubsub = require('lucos_pubsub');

var enabled = false;

function speak(message) {
	if (!enabled) return;
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
		enabled = true;
	},
	disable: function () {
		enabled = false;
	},
}