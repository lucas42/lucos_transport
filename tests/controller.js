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
	Controller(getTemplate).process('/').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage homepage EndPage TFLuke/TFLuke');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	});
});


/** Route Page **/
test.cb('Route Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "route") return Promise.resolve("route");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/route/net1/route1').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage route EndPage TFLuke - route1/route1');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	});
});
test.cb('Route Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/route/').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	});
});
test.cb('Route Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/route/net1/route7').then(result => {
		test.is(result.action, 'notfound');
		test.is(result.message, "Can't find route /net1/route7");
		test.end();
	});
});


/** Stop Page **/
test.cb('Stop Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "station") return Promise.resolve("stop");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/stop/net1/stop1').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage stop EndPage TFLuke - 🚂 Station/🚂 Station');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	});
});
test.cb('Stop Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/stop/').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	});
});
test.cb('Stop Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/stop/net1/route1').then(result => {
		test.is(result.action, 'notfound');
		test.is(result.message, "Can't find stop /net1/route1");
		test.end();
	});
});


/** Vehicle Page **/
test.cb('Vehicle Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{title}}");
		if (id == "vehicle") return Promise.resolve("vehicle");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/vehicle/net1/route1/boat1').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage vehicle EndPage Matilda (Routeface)');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
		});
		test.end();
	});
});
test.cb('Vehicle Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/vehicle/').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	});
});
test.cb('Vehicle Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/vehicle/net1/route1/train3').then(result => {
		test.is(result.action, 'notfound');
		test.is(result.message, "Can't find vehicle train3");
		test.end();
	});
});

/** Unknown Type **/
test.cb('Page Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/smartypants').then(result => {
		test.is(result.action, 'unknown');
		test.end();
	});
});


/** Get Partial **/
test.cb('Vehicle Partial Render', test => {
	function getTemplate(id) {
		if (id == "vehicle") return Promise.resolve("vehicle {{title}}");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate).process('/vehicle/net1/route1/boat1', {accept: 'text/partial-html'}).then(result => {
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
	});
});

/** Loading Page **/
test.cb('Service Worker Loading Page', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "loading") return Promise.resolve("loading");
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate, true).process('/loading').then(result => {
		test.is(result.action, 'response');
		test.is(result.body, 'StartPage loading EndPage TFLuke/');
		test.deepEqual(result.headers, {
			'Cache-Control': 'public, max-age=0',
			'Content-Type': 'text/html; charset=utf-8',
			'refresh': '0.01',
		});
		test.end();
	});
});
test.cb('Server Loading Page', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
		return Promise.resolve("error");
	}
	Controller(getTemplate, false).process('/loading').then(result => {
		test.is(result.action, 'redirect');
		test.is(result.path, '/');
		test.end();
	});
});