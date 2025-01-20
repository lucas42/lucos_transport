import { init } from './announcements.js'
var speak;
var currentClassType;
var currentExtraData;

// Lazy load sound, only when needed
function preload() {
	/*const speech = require("mespeak");

	// Setup voice module
	speech.loadConfig(require("mespeak/src/mespeak_config.json"));
	speech.loadVoice(require("mespeak/voices/en/en-rp.json"));

	var queue = [];
	var isSpeaking = false;
	speak = function speak(message) {
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
	}*/
}
function load() {

	// Only bother really loading if sound is enabled
	if (!soundIsEnabled()) return;
	if (!speak) preload();
	init(currentClassType, currentExtraData, speak);
}

function soundIsEnabled() {
	return !!localStorage.getItem("soundEnabled");
}

export default {
	enable: () => {
		localStorage.setItem("soundEnabled", true);
		setTimeout(load, 0);
	},
	disable: () => {
		localStorage.removeItem("soundEnabled");
	},
	isEnabled: soundIsEnabled,
	load: (classType, extraData) => {
		currentClassType = classType;
		currentExtraData = extraData || {};
		setTimeout(load, 0);
	}
}

