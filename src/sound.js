import { init } from './announcements.js'
var speak;
var currentClassType;
var currentExtraData;

// Lazy load sound, only when needed
function preload() {
	var queue = [];
	var isSpeaking = false;

	let preferredVoice;
	window.speechSynthesis.addEventListener("voiceschanged", () => {
		// Pick a voice for speech - choose one in British English, that doesn't require any remote calls, with a preference for "Martha"
		preferredVoice = window.speechSynthesis.getVoices().filter(voice => voice.lang === 'en-GB' && voice.localService).sort((a,b) => a.name=="Martha" && -1).shift();
		console.log("voice loaded", preferredVoice);
	});
	speak = function speak(message) {
		if (!soundIsEnabled()) return;
		if (isSpeaking) {
			queue.push(message);
			return;
		}
		isSpeaking = true;
		const utterance = new SpeechSynthesisUtterance(message);
		if (preferredVoice) utterance.voice = preferredVoice;
		utterance.addEventListener('end', () => {
			isSpeaking = false;
			if (queue.length) {
				speak(queue.shift());
			}
		});
		utterance.addEventListener('error', event => {
			isSpeaking = false;
			if (event.error == 'not-allowed') {
				console.log("//TODO: automatically make sound button disabled")
			} else {
				console.error("utterance hit unknown error", event.error);
			}
		})
		window.speechSynthesis.speak(utterance);
	}
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
		speak("Announcents On");
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

