const speech = require("mespeak"),
	Announcements = require("./announcements");

// Setup voice module
speech.loadConfig(require("mespeak/src/mespeak_config.json"));
speech.loadVoice(require("mespeak/voices/en/en-rp.json"));

var queue = [];
var isSpeaking = false;
function speak(message) {
	if (!localStorage.getItem("soundEnabled")) return;
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

Announcements(document.body.dataset.classtype, document.body.dataset.classid, extraData, speak);

module.exports = {
	enable: function () {
		localStorage.setItem("soundEnabled", true);
	},
	disable: function () {
		localStorage.removeItem("soundEnabled");
	},
	isEnabled: function () {
		return !!localStorage.getItem("soundEnabled");
	}
}

