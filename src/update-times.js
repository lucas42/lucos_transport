var Pubsub = require('lucos_pubsub');

var timestimeout;
var updatesEnabled = true;
/**
 * Keep all times update-to-date (once a second)
 */
function updateTimes() {
	if (timestimeout) clearTimeout(timestimeout);
	if (!updatesEnabled) return;
	Pubsub.send("updateTimes");

	// TODO: use lucos_time for current time
	timestimeout=setTimeout(updateTimes, 1000-(new Date().getMilliseconds()));
}
updateTimes();

/**
 * Allow serivce worker a way to prevent proccessing intensive actions when it's trying to do something else
 **/
setUpdatesEnabled = function setUpdatesEnabled(enabled) {
	updatesEnabled = !!enabled;
	if (updatesEnabled) setTimeout(updateTimes, 0);
}