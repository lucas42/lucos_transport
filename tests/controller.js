import test from 'ava';
const Network = require('../src/classes/network'),
	Route = require('../src/classes/route'),
	Stop = require('../src/classes/stop'),
	Vehicle = require('../src/classes/vehicle');
var net1 = new Network('net1');
var route1 = new Route(net1, 'route1');
route1.setField('name', "Routeface");
var stop1 = new Stop(net1, 'stop1');
stop1.setField('title', "🚂 Station");
var vehicle1 = new Vehicle(route1, 'boat1');
vehicle1.setField('name', "Matilda");
vehicle1.setField('lastUpdated', "yesterday");

// Module under test
const Controller = require("../src/controller");

/** Homepage **/
test.cb('Homepage Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "routes") return Promise.resolve("homepage");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage homepage EndPage TFLuke/TFLuke');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});

test.cb('TFL Page', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}");
		if (id == "routes") return Promise.resolve("tflpage {{datapoint}}");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		if (source == "tfl" && type == "routes") return Promise.resolve({datapoint: "livedata", title: "The Title"});
		test.fail(`Unexpected data fetch for '${source}', '${type}'`);
		return Promise.resolve("error");
	}
	Controller(getTemplate, dataFetcher).process('/tfl').then(result => {
		test.is('response', result.action);
		test.is('StartPage tflpage livedata EndPage TFLuke - The Title', result.body);
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
	}).catch(error => {test.fail(error)}).then(test.end);
});


/** Route Page **/
test.cb('Route Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "route") return Promise.resolve("route");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/route/net1/route1').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage route EndPage TFLuke - route1/route1');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Route Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/route/').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Route Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/route/net1/route7').then(result => {
		test.is(result.action, 'notfound');
		test.is(result.message, "Can't find route /net1/route7");
	}).catch(test.fail).then(test.end);
});

test.cb('Dynamic Route', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}");
		if (id == "route") return Promise.resolve("route {{datapoint}}");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		if (source == "tfl" && type == "route" && id == "bob") 
			return Promise.resolve({datapoint: "livedata", title: "The Title"});
		test.fail(`Unexpected data fetch for '${source}', '${type}', '${id}'`);
		return Promise.resolve("error");
	}
	Controller(getTemplate, dataFetcher).process('/tfl/route/bob').then(result => {
		test.is('response', result.action);
		test.is('StartPage route livedata EndPage TFLuke - The Title', result.body);
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Dynamic Route Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		return Promise.reject("notfound");
	}
	Controller(getTemplate, dataFetcher).process('/tfl/route/bob2').then(result => {
		test.is('notfound', result.action);
		test.is("Can't find route", result.message);
	}).catch(error => {test.fail(error)}).then(test.end);
});

test.cb('Data Fetch Error', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		return Promise.reject("connection problem");
	}
	Controller(getTemplate, dataFetcher).process('/tfl/route/bob2').then(result => {
		test.fail("Result returned when data fetch failed");
	}).catch(error => {
		test.is("connection problem", error);
	}).then(test.end);
});
test.cb('Dynamic Route Data', test => {
	function getTemplate(id) {
		test.fail(`Template shouldn't be needed to serve JSON`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		if (source == "tfl" && type == "route" && id == "bob") 
			return Promise.resolve({datapoint: "livedata", title: "The Title"});
		test.fail(`Unexpected data fetch for '${source}', '${type}', '${id}'`);
		return Promise.resolve("error");
	}
	Controller(getTemplate, dataFetcher).process('/tfl/route/bob.json').then(result => {
		test.is('response', result.action);
		test.deepEqual({datapoint: "livedata", title: "The Title"}, JSON.parse(result.body));
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'application/json; charset=utf-8',
		});
	}).catch(error => {test.fail(error)}).then(test.end);
});


/** Stop Page **/
test.cb('Stop Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "stop") return Promise.resolve("stop");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/stop/net1/stop1').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage stop EndPage TFLuke - 🚂 Station/🚂 Station');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Stop Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/stop/').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Stop Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/stop/net1/route1').then(result => {
		test.is(result.action, 'notfound');
		test.is(result.message, "Can't find stop /net1/route1");
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});

test.cb('Dynamic Stop', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}");
		if (id == "stop") return Promise.resolve("stop {{datapoint}}");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		test.is("tfl", source);
		test.is("stop", type);
		test.is("mordor", id);
		return Promise.resolve({datapoint: "livedata", title: "Mordor, Middle Earth"});
	}
	Controller(getTemplate, dataFetcher).process('/tfl/stop/mordor').then(result => {
		test.is('response', result.action);
		test.is('StartPage stop livedata EndPage TFLuke - Mordor, Middle Earth', result.body);
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
	}).catch(error => {test.fail(error)}).then(test.end);
});


/** Vehicle Page **/
test.cb('Vehicle Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{title}}");
		if (id == "vehicle") return Promise.resolve("vehicle");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/vehicle/net1/route1/boat1').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage vehicle EndPage Matilda (Routeface)');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Vehicle Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/vehicle/').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Vehicle Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/vehicle/net1/route1/train3').then(result => {
		test.is(result.action, 'notfound');
		test.is(result.message, "Can't find vehicle train3");
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});

test.cb('Dynamic Vehicle', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}");
		if (id == "vehicle") return Promise.resolve("vehicle {{datapoint}}");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		if (source == "tfl" && type == "vehicle" && id == "123") 
			return Promise.resolve({datapoint: "livedata", title: "The Title"});
		test.fail(`Unexpected data fetch for '${source}', '${type}', '${id}'`);
		return Promise.resolve("error");
	}
	Controller(getTemplate, dataFetcher).process('/tfl/vehicle/123').then(result => {
		test.is('response', result.action);
		test.is('StartPage vehicle livedata EndPage TFLuke - The Title', result.body);
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Dynamic Vehcile Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher(source, type, id) {
		return Promise.reject("notfound");
	}
	Controller(getTemplate, dataFetcher).process('/tfl/vehicle/321').then(result => {
		test.is('notfound', result.action);
		test.is("Can't find vehicle", result.message);
	}).catch(error => {test.fail(error)}).then(test.end);
});

/** Unknown Type **/
test.cb('Page Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/smartypants').then(result => {
		test.is(result.action, 'unknown');
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});


/** Get Partial **/
test.cb('Vehicle Partial Render', test => {
	function getTemplate(id) {
		if (id == "vehicle") return Promise.resolve("vehicle {{title}}");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher).process('/vehicle/net1/route1/boat1', {accept: 'text/partial-html'}).then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'vehicle Matilda (Routeface)');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/partial-html; charset=utf-8',
			'title': 'Matilda (Routeface)',
			'cssClass': 'route_route1 network_net1 vehicle_matilda',
			'classType': 'Vehicle',
			'classID': 'Vehicle-net1,route1,boat1',
			'lastUpdated': 'yesterday',
		});
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});

/** Loading Page **/
test.cb('Service Worker Loading Page', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "loading") return Promise.resolve("loading");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher, true).process('/loading').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage loading EndPage TFLuke/');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
			'refresh': '0.01',
		});
		test.end();
	}).catch(error => {test.fail(error)}).then(test.end);
});
test.cb('Server Loading Page', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	function dataFetcher() {
		test.fail("Unneeded call to dataFetcher");
	}
	Controller(getTemplate, dataFetcher, false).process('/loading').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	});
});