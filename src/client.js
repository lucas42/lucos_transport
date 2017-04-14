const Pubsub = require('lucos_pubsub'),
speech = require("mespeak");

// Setup voice module
speech.loadConfig(require("mespeak/src/mespeak_config.json"));
speech.loadVoice(require("mespeak/voices/en/en-rp.json"));

function pageLoad() {
	(function initFooter() {
		const footer = document.getElementById('footer');

		// The data-refreshable flag should only be set on pages served by service worker
		if (!footer || !footer.dataset.refreshable) return;
		footer.addEventListener("click", refresh, false);
		footer.dataset.listening = true;
	 })();
}


/**
 * Refresh the client-side data
 *
 * Should only be available on pages served by service worker
 * Therefore can make http calls not understood by server
 **/
function refresh() {
	var footer = this;
	footer.dataset.loading = true;
	fetch('/refresh').then(response => {
		if (response.status != 204) {
			footer.dataset.failure = true;
			response.text().then(text => {
				console.error(text);
			});
		} else {
			delete footer.dataset.failure;
			speech.speak("Updated.");
		}
		delete footer.dataset.loading;
	});

}

// If the page is still loading, wait till it's done to do stuff
if (Document.readyState == "loading") {
	document.addEventListener('DOMContentLoaded', pageLoad);

// If the page has already loaded, do stuff now
} else {
	pageLoad();
}

// When the event's time changes, update the DOM accordingly
Pubsub.listen('updateEventTime', function (eventData) {
	var DOMNode = document.getElementById(eventData.id);
	if (!DOMNode) return;
	if (DOMNode.dataset.eventtype == "vehicle") {
		DOMNode.querySelector('.stoptime').textContent = eventData.vehicleReadableTime;
	} else if (DOMNode.dataset.eventtype == "station") {
		DOMNode.querySelector('.departtime').textContent = eventData.stationReadableTime;
	}
});

// When an event is removed, remove it from the DOM too.
Pubsub.listen('eventRemoved', function (eventData) {
	var DOMNode = document.getElementById(eventData.id);
	if (!DOMNode) return;
	DOMNode.parentNode.removeChild(DOMNode);
});


(function swHelperInit() {
	var registration;
	if ('serviceWorker' in navigator) {
		registration = navigator.serviceWorker.register('/serviceworker.js');
	} else {
		registration = new Promise(function(resolve, reject) {
			throw "no service worker support";
		});
	}
	registration.then(function swRegistered(registration) {
		console.log('ServiceWorker registration successful with scope: ' + registration.scope);
		registration.update();
	}).catch(function swError(error) {
		console.error('ServiceWorker registration failed: ' + error);
	});
})();