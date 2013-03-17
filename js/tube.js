"use strict"
var content, tubedata, datatimeout, timestimeout, lucos = require('lucosjs');
lucos.waitFor('ready', function _tubeloader() {
	if (lucos.nav.enable('/tube/', _controller)) {
		_updateTimes();
		content = document.getElementById('content');
		if (content) content.innerHTML = lucos.render('splashscreen', "Fetching tube data");
		_loadData();
	}
	if (lucos.nav.isPreload()) {
		_fetchData(true, true);
		return;
	}
	
});

/**
 * Keep all departure times update-to-date (once a second)
 */
function _updateTimes() {
	if (timestimeout) window.clearTimeout(timestimeout);
	var as, i, l, secondsTo, text, minsTo, parent;
	if (content && content.getElementsByTagName) {
		as = content.getElementsByTagName('a');
		for (i=0, l=as.length; i<l; i++) {
			if (!as[i].getAttribute('class') || !as[i].getAttribute('class').match(/departtime|stoptime/)) continue;
			secondsTo = as[i].getAttribute('data-timestamp') - Math.round(lucos.getTime()/1000);
			if (secondsTo < -30) {
				text = 'delete';
				parent = as[i].parentNode;
				if (parent.nodeName == 'TD') parent = parent.parentNode;
				parent.parentNode.removeChild(parent);
				i--;
				l=as.length;
				continue;
			} else if (secondsTo < -10) {
				if (as[i].getAttribute('class').match(/stoptime/)) text = 'passed it';
				else text = 'missed it';
			} else if (secondsTo < 1) {
				text = 'now';
			} else if (secondsTo < 60) {
				text = secondsTo + ' secs';
			//} else if (secondsTo == 60) {
			//	text = '1   min ';
			} else {
				minsTo = Math.floor(secondsTo / 60);
				secondsTo = secondsTo % 60;
				if (secondsTo < 10) secondsTo = ':0'+secondsTo;
				else secondsTo = ':'+secondsTo;
				text = minsTo+secondsTo+' mins';
			}
			as[i].firstChild.nodeValue = text;
		}
	}
	timestimeout=setTimeout(_updateTimes, 1000-(new Date(lucos.getTime())).getMilliseconds());
}
	
/**
 * Get data from localstorage falling back to a network request
 */
function _loadData() {
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
	lucos.send("newtubedata", data);
	tubedata = data;
	setDataTimeout(expires);
	if (lucos.detect.isDev() && console) console.log(data);
	Routes.calculate();
	lucos.nav.refresh();
	_updateFooter(fetched, expires);
}

var currentView = null;
function _controller(path) {
	var parts = path.split('/'), renderdata = {}, linecode, station, ii, ll, jj, jl, m, traindata, secondsTo, cssClass, classes, linedata;
	require('linejs').setCurrent(null);
	if (lucos.nav.isPreload()) return;
	if (!content) throw "No content div found";
	if (currentView) currentView.teardown();
	try {
		if (parts[1] != 'tube') throw "Not a tube url.";
		document.body.removeClass("nofooter");
		if (!parts[2]) {
			content.innerHTML = _renderNetwork();
		} else if (typeof tubedata.stations[parts[2]] == 'object') {
			content.innerHTML = _renderStation(parts[2]);
		} else if (m = parts[2].match(/^([A-Z])(\d+)$/)) {
			content.innerHTML = _renderTrain(m[1], m[2]);
		} else if (linecode = _getLineId(parts[2])){
			
			// If the line name isn't quite right, correct it
			if (tubedata.lines[linecode] != parts[2]) {
				debugger;
				lucos.nav.replace(encodeURIComponent(tubedata.lines[linecode]));
			}
			currentView = new (require('linejs').construct)(linecode, content);
		} else {
			lucos.nav.replace('');
		}
	} catch (e) {
		content.innerHTML = lucos.render('error', e);
	}
	_updateTimes();
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
function _renderNetwork() {
	var code, linedata;
	var renderdata = {
		lines: []
	};
	for (code in tubedata.lines) {
		linedata = {
			name: tubedata.lines[code],
			link: '/tube/'+encodeURIComponent(tubedata.lines[code]),
			cssClass: tubedata.lines[code].replace(/[ &]/g, ''),
		};
		if (typeof tubedata.status[code] == 'object') {
			linedata.status = tubedata.status[code].status;
			linedata.details = tubedata.status[code].details;
		}
		renderdata.lines.push(linedata);
	}
	lucos.addNavBar("Tube");
	return lucos.render('lines', renderdata);
	
}
function _renderStation(stationcode, connectedstation) {
	var code, ii, ll, secondsTo, traindata, classes, cssClass, output, interchangeset;
	var station = tubedata.stations[stationcode];
	var renderdata = {
		name: station.n,
		platforms: [],
		connected: !!connectedstation
	};
	var platforms = {};
	for (code in station.p) {
		platforms[code] = {
			name: station.p[code]+(connectedstation ? " ("+station.n+")":""),
			trains: [],
			classes: {},
			used: false
		};
	}
	renderdata.lines = [];
	for (ii=0, ll=station.l.length; ii<ll; ii++) {
		code = station.l[ii];
		renderdata.lines.push({
			name: tubedata.lines[code],
			link: '/tube/'+encodeURIComponent(tubedata.lines[code]),
			cssClass: tubedata.lines[code].replace(/[ &]/g, '')
		});
	}
	for (ii=0, ll=tubedata.stops.length; ii<ll; ii++) {
		if (tubedata.stops[ii].s != stationcode) continue;
		secondsTo = tubedata.stops[ii].i - Math.round(lucos.getTime()/1000);
		traindata = {};
		
		platforms[tubedata.stops[ii].p].used = true;
		platforms[tubedata.stops[ii].p].classes[tubedata.stops[ii].l] = tubedata.lines[tubedata.stops[ii].l].replace(/[ &]/g, '').toLowerCase();
		
		if (secondsTo <= 0) traindata.now = true;
		traindata.SecondsTo = secondsTo;
		traindata.timestamp = tubedata.stops[ii].i;
		if (tubedata.stops[ii].t == 0) traindata.ghost = true;
		traindata.link = '/tube/'+tubedata.stops[ii].l+tubedata.stops[ii].t;
		traindata.Destination = tubedata.destinations[tubedata.stops[ii].d];
		traindata.line = tubedata.lines[tubedata.stops[ii].l];
		traindata.route = tubedata.stops[ii].r;
		platforms[tubedata.stops[ii].p].trains.push(traindata);
	}
	
	// Join all the lines which use the platform together to make the CSS class
	for (ii in platforms) {
		classes = [];
		for (code in platforms[ii].classes) {
			classes.push(platforms[ii].classes[code]);
		}
		classes.sort();
		cssClass = classes.join('_');
		if (!cssClass) cssClass = platforms[ii].used?'used':'unused';
		platforms[ii].cssClass = cssClass;
		platforms[ii].trains.sort(function (a, b) {
			return a.SecondsTo - b.SecondsTo;
		});
		renderdata.platforms.push(platforms[ii]);
	}
	output = lucos.render('station', renderdata)
	if (!connectedstation) {
		lucos.addNavBar(station.n);
		interchangeset = _getInterchanges(stationcode);
		for (ii=0, ll=interchangeset.length; ii<ll; ii++) {
			if (interchangeset[ii].type == 'tube' && interchangeset[ii].code) {
				output += _renderStation(interchangeset[ii].code, true);
			}
		}
	}
	
	return output;
	
}
function _renderTrain(linecode, setno) {
	var ii, li, secondsTo, station, jj, jl, kk, kl, interchanges, externalinterchanges, symbols, totaltime;
	document.body.addClass("nofooter");
	var renderdata = {
		stops: [],
		linename: tubedata.lines[linecode],
		linelink: '/tube/'+encodeURIComponent(tubedata.lines[linecode]),
		set: setno,
		cssClass: tubedata.lines[linecode].replace(/[ &]/g, '')
	};
	
	stopLoop: for (ii=0, li=tubedata.stops.length; ii<li; ii++) {
		if (tubedata.stops[ii].l != linecode || tubedata.stops[ii].t != setno) continue;
		secondsTo = tubedata.stops[ii].i - Math.round(lucos.getTime()/1000);
		station = tubedata.stations[tubedata.stops[ii].s];
		
		// Check for other platforms in this station and merge them
		for (jj=0, jl=renderdata.stops.length; jj<jl; jj++) {
				if (renderdata.stops[jj].station.code == tubedata.stops[ii].s) {
					if (!renderdata.stops[jj].platcount) renderdata.stops[jj].platcount = 1;
					totaltime = renderdata.stops[jj].secondsTo * renderdata.stops[jj].platcount;
					totaltime += secondsTo;
					renderdata.stops[jj].platcount++;
					renderdata.stops[jj].secondsTo = totaltime / renderdata.stops[jj].platcount;
					delete renderdata.stops[jj].platform;
					continue stopLoop;
				}
		}
		
		
		interchanges = [];
		symbols = [];
		for (jj=0, jl=station.l.length; jj<jl; jj++) {
			if (station.l[jj] == linecode) continue;
			interchanges.push(
				{
					title: tubedata.lines[station.l[jj]],
					type: "tube",
					cssClass: tubedata.lines[station.l[jj]].replace(/[ &]/g, '')
				}
			);
		}
		externalinterchanges = _getInterchanges(tubedata.stops[ii].s);
		for (jj=0, jl=externalinterchanges.length; jj<jl; jj++) {
			if (externalinterchanges[jj].type == 'tube' && externalinterchanges[jj].code) {
				for (kk=0, kl=tubedata.stations[externalinterchanges[jj].code].l.length; kk<kl; kk++) {
					interchanges.push(
						{
							title: tubedata.lines[tubedata.stations[externalinterchanges[jj].code].l[kk]],
							type: "tube",
							cssClass: tubedata.lines[tubedata.stations[externalinterchanges[jj].code].l[kk]].replace(/[ &]/g, '')
						}
					);
				}
			} else if (externalinterchanges[jj].name == station.n && (externalinterchanges[jj].type in lucos.bootdata.symbols)) {
				symbols.push(
					{
						alt: externalinterchanges[jj].type,
						src: lucos.bootdata.symbols[externalinterchanges[jj].type],
					}
				);
			} else {
				interchanges.push(
					{
						title: externalinterchanges[jj].name,
						type: externalinterchanges[jj].type,
						cssClass: '', // set empty class to prevent inheriting from line's cssClass
						symbol: lucos.bootdata.symbols[externalinterchanges[jj].type],
					}
				);
			}
		}
		interchanges.sort(function _sortfunc(a, b) {
			if (a.type != b.type) {
				if (a.type == 'tube') return 1;
				if (b.type == 'tube') return -1;
				return a.type > b.type;
			} else {
				return a.title > b.title;
			}
		});
		renderdata.stops.push({
			secondsTo: secondsTo,
			timestamp: tubedata.stops[ii].i,
			station: {name: station.n, code: tubedata.stops[ii].s},
			platform: {name: station.p[tubedata.stops[ii].p]},
			link: '/tube/'+tubedata.stops[ii].s,
			symbols: symbols,
			interchanges: interchanges,
			isinterchange: interchanges.length > 0
		});
		renderdata.linecode = tubedata.stops[ii].l;
		renderdata.destination = tubedata.destinations[tubedata.stops[ii].d];
		renderdata.location = tubedata.stops[ii].c;
	}
	renderdata.stops.sort(function (a, b) {
		return a.timestamp - b.timestamp;
	});
	
	if (renderdata.stops.length) {
		
		// If the last station is not the destination, then display an arrow at the bottom of list
		var laststation = renderdata.stops[renderdata.stops.length-1].station.name.replace(/\(.*\)/, '');
		var destination = renderdata.destination.replace(/via .*/, '');
		if (destination.indexOf(laststation) == -1 && laststation.indexOf(destination) == -1) renderdata.continues = true;
	}
	
	// Interate through all the stops other than first and last to look for adjacent interchanges
	// First and last stops won't have interchanges removed, which could lead to inconsistentcies as the first/last stop changes
	for (ii=1, li=renderdata.stops.length-1; ii<li; ii++) {
		for (jj=0, jl=renderdata.stops[ii].interchanges.length; jj<jl; jj++) {
			var interchange_at_prev_station = false;
			for (kk=0, kl=renderdata.stops[ii-1].interchanges.length; kk<kl; kk++) {
				if (renderdata.stops[ii].interchanges[jj].type != renderdata.stops[ii-1].interchanges[kk].type) continue;
				if (renderdata.stops[ii].interchanges[jj].title != renderdata.stops[ii-1].interchanges[kk].title) continue;
				interchange_at_prev_station = true;
			}
			if (!interchange_at_prev_station) continue;
			var interchange_at_next_station = false;
			for (kk=0, kl=renderdata.stops[ii+1].interchanges.length; kk<kl; kk++) {
				if (renderdata.stops[ii].interchanges[jj].type != renderdata.stops[ii+1].interchanges[kk].type) continue;
				if (renderdata.stops[ii].interchanges[jj].title != renderdata.stops[ii+1].interchanges[kk].title) continue;
				interchange_at_next_station = true;
			}
			if (!interchange_at_next_station) continue;
			
			// Add ignore flag rather than remove from array, as that would cause issues for the next stop
			renderdata.stops[ii].interchanges[jj].ignore = true;
		}
	}
	
	require('linejs').setCurrent(renderdata.linename);
	lucos.addNavBar(renderdata.linename+" Line Train "+renderdata.set);
	if (!renderdata.stops.length) throw "Can't find "+renderdata.linename+" line train "+renderdata.set;
	return lucos.render('train', renderdata);
	
}
function _getInterchanges(stationcode) {
	var set, output, jj, jl, ii, match, li = lucos.bootdata.interchanges.length;
	for (ii=0; ii<li; ii++) {
		set = lucos.bootdata.interchanges[ii];
		match = false;
		output = [];
		for (jj=0, jl=set.length; jj<jl; jj++) {
			if (set[jj].type == "tube" && set[jj].code == stationcode) {
				match = true;
			} else {
				output.push(set[jj]);
			}
		}
		if (match) return output;
	}
	return [];
}
function _updateFooter(fetched, expires) {
	var footer=document.getElementById('footer');
	if (!footer) return;
	var text = "Last updated: "+fetched+", expires: "+expires;
	if (footer.innerText != text) footer.innerText = text;
}
