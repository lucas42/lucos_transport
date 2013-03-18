"use strict"
var content, tubedata, datatimeout, lucos = require('lucosjs');
lucos.waitFor('ready', function _tubeloader() {
	if (lucos.nav.enable('/tube/', _controller)) {
			  
		require("stopjs").updateTimes();
		content = document.getElementById('content');
		if (content) content.innerHTML = lucos.render('splashscreen', "Fetching tube data");
		_loadData();
		initFooter();
	}
	if (lucos.nav.isPreload()) {
		_fetchData(true, true);
		return;
	}
	
});

	
/**
 * Get data from localstorage falling back to a network request
 */
function _loadData() {
	lucos.waitFor('newtubedata', function () {lucos.nav.refresh(); });
	try {
		if (!localStorage.getItem('tubedata')) throw "data not in storage";
		_gotData(JSON.parse(localStorage.getItem('tubedata')), new Date(parseInt(localStorage.getItem('tubedataexpires'))), new Date(parseInt(localStorage.getItem('tubedatafetched'))));
		
		// For old data, display it, but fetch new data too
		if (localStorage.getItem('tubedataexpires') < lucos.getTime()) _fetchData();
	} catch (e) {
		_fetchData(true);
	}
}
function _fetchData(userwaiting, preload) {
	lucos.net.get("/data/tube", null, function _dataFetched(req) {
		var expires = new Date(req.getResponseHeader('Expires'));
		var fetched = new Date(lucos.getTime());
		try {
			localStorage.setItem('tubedata', req.responseText);
			localStorage.setItem('tubedataexpires', expires.getTime());
			localStorage.setItem('tubedatafetched', fetched.getTime());
		} catch (e) {
			if (e.code == 22) { // Quota exceeded exception
				if (console) console.log("localStorage Quota exceeded.  Clearing and trying again");
				localStorage.clear();
				location.reload();
			}
			return;
		}
		if (!preload) _gotData(JSON.parse(req.responseText), expires, fetched);
	}, function _dataError() {
		// If noone is waiting for the data, then ignore the error and try again laters
		if (!userwaiting) {
			setDataTimeout(null);
			return;
		}
		if (content) content.innerHTML = lucos.render('error', "Problem retreiving tube data.");
		else throw "Problem retreiving tube data.";
	});
}
function setDataTimeout(time) {
	var msecs = 0;
	if (datatimeout) window.clearTimeout(datatimeout);
	if (time) msecs = time.getTime() - lucos.getTime();
	if (msecs < 10000) msecs = 10000;
	datatimeout = window.setTimeout(_fetchData, msecs);
}

function _gotData(data, expires, fetched) {
	tubedata = data;
	lucos.send("newtubedata", data);
	setDataTimeout(expires);
	if (lucos.detect.isDev() && console) console.log(data);
	lucos.send("dataupdate", {expires: expires, fetched: fetched});
	//Routes.calculate();
}

var currentView = null;
function _controller(path) {
	var parts = path.split('/'), renderdata = {}, linecode, station, ii, ll, jj, jl, m, traindata, secondsTo, cssClass, classes, linedata;
	if (lucos.nav.isPreload()) return;
	if (!content) throw "No content div found";
	if (currentView) currentView.teardown();
	try {
		if (parts[1] != 'tube') throw "Not a tube url.";
		document.body.removeClass("nofooter");
		if (!parts[2]) {
			currentView = new (require('networkjs').construct)(content);
		} else if (typeof tubedata.stations[parts[2]] == 'object') {
			currentView = new (require('stationjs').construct)(parts[2], content);
		} else if (m = parts[2].match(/^([A-Z])(\d+)$/)) {
			currentView = new (require('trainjs').construct)(m[1], m[2], content);
		} else if (linecode = _getLineId(parts[2])){
			
			// If the line name isn't quite right, correct it
			if (tubedata.lines[linecode] != parts[2]) {
				lucos.nav.replace(encodeURIComponent(tubedata.lines[linecode]));
			}
			currentView = new (require('linejs').construct)(linecode, content);
		} else {
			lucos.nav.replace('');
		}
	} catch (e) {
		content.innerHTML = lucos.render('error', e);
	}
}
function _getLineId(name) {
	var i;
	name = name.toUpperCase();
	
	// Check if its already an ID
	if (name in tubedata.lines) return name;
	
	for (i in tubedata.lines) {
		if (tubedata.lines[i].toUpperCase() == name) return i;
	}
	return null;
}
var Routes = (function _routes() {
	var routelines;
	function calculateRoutes() {
		var route, stop, ii, ll;
		routelines = {};
		for (ii=0, ll=tubedata.stops.length; ii<ll; ii++) {
			stop = tubedata.stops[ii];
			if (typeof routelines[stop.r] != 'object') routelines[stop.r] = {};
			if (typeof routelines[stop.r][stop.l] != 'number') routelines[stop.r][stop.l] = 0;
			routelines[stop.r][stop.l]++;
		};
	}
	return {
		calculate: calculateRoutes
	}
})();

function initFooter() {
	var footer, text;
	footer = document.getElementById('footer');
	if (!footer) return;
	lucos.pubsub.listenExisting("dataupdate", function _updateFooter(metadata) {
		var newtext = "Last updated: "+metadata.fetched+", expires: "+metadata.expires;
		if (newtext != text) {
			text = newtext;
			footer.innerText = text;
		}
	});
 }
