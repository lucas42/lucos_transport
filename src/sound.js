var loadStarted = false;

// Lazy load sound, only when needed
function load() {
	if (loadStarted) return;
	loadStarted = true;
	const speech = require("mespeak"),
		Announcements = require("./announcements");

	// Setup voice module
	speech.loadConfig(require("mespeak/src/mespeak_config.json"));
	speech.loadVoice(require("mespeak/voices/en/en-rp.json"));

	var queue = [];
	var isSpeaking = false;
	function speak(message) {
		if (!soundIsEnabled()) return;
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
	let extraData = {};
	if (typeof routeData !== "undefined") extraData.routes = routeData;

	Announcements(document.body.dataset.classtype, extraData, speak);
}

function soundIsEnabled() {
	return !!localStorage.getItem("soundEnabled");
}
module.exports = {
	enable: function () {
		localStorage.setItem("soundEnabled", true);
		window.setTimeout(load, 0);
	},
	disable: function () {
		localStorage.removeItem("soundEnabled");
	},
	isEnabled: soundIsEnabled,
	load: function () {
		// Only bother really loading if sound is enabled,
		// Otherwise load when enabled
		if (soundIsEnabled()) window.setTimeout(load, 0);
	}
}

