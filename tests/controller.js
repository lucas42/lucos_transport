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

// Module under test
const Controller = require("../src/controller");

/** Homepage **/
test.cb('Homepage Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "routes") return Promise.resolve("homepage");
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.is(html, 'StartPage homepage EndPage TFLuke/TFLuke');
			test.deepEqual(headers, {
				'Cache-Control': 'public, max-age=0',
				'Content-Type': 'text/html; charset=utf-8',
			});
		},
		response404: message => {
			test.fail('Returned unexpected 404 response');
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/').then(test.end);
});

/** Route Page **/
test.cb('Route Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "route") return Promise.resolve("route");
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.is(html, 'StartPage route EndPage TFLuke - route1/route1');
			test.deepEqual(headers, {
				'Cache-Control': 'public, max-age=0',
				'Content-Type': 'text/html; charset=utf-8',
			});
		},
		response404: message => {
			test.fail('Returned unexpected 404 response');
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/route/net1/route1').then(test.end);
});
test.cb('Route Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.fail('Returned unexpected 200 response');
		},
		response404: message => {
			test.fail('Returned unexpected 404 response');
		},
		redirect: path => {
			test.is(path, '/');
		}
	}, '/route/').then(test.end);
});
test.cb('Route Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.fail('Returned unexpected 200 response');
		},
		response404: message => {
			test.is(message, "Can't find route /net1/route7");
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/route/net1/route7').then(test.end);
});


/** Stop Page **/
test.cb('Stop Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{headtitle}}/{{title}}");
		if (id == "station") return Promise.resolve("stop");
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.is(html, 'StartPage stop EndPage TFLuke - 🚂 Station/🚂 Station');
			test.deepEqual(headers, {
				'Cache-Control': 'public, max-age=0',
				'Content-Type': 'text/html; charset=utf-8',
			});
		},
		response404: message => {
			test.fail('Returned unexpected 404 response');
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/stop/net1/stop1').then(test.end);
});
test.cb('Stop Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.fail('Returned unexpected 200 response');
		},
		response404: message => {
			test.fail('Returned unexpected 404 response');
		},
		redirect: path => {
			test.is(path, '/');
		}
	}, '/stop/').then(test.end);
});
test.cb('Stop Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.fail('Returned unexpected 200 response');
		},
		response404: message => {
			test.is(message, "Can't find stop /net1/route1");
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/stop/net1/route1').then(test.end);
});


/** Vehicle Page **/
test.cb('Vehicle Render', test => {
	function getTemplate(id) {
		if (id == "page") return Promise.resolve("StartPage {{content}} EndPage {{title}}");
		if (id == "vehicle") return Promise.resolve("vehicle");
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.is(html, 'StartPage vehicle EndPage Matilda (Routeface)');
			test.deepEqual(headers, {
				'Cache-Control': 'public, max-age=0',
				'Content-Type': 'text/html; charset=utf-8',
			});
		},
		response404: message => {
			test.fail('Returned unexpected 404 response');
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/vehicle/net1/route1/boat1').then(test.end);
});
test.cb('Vehicle Redirect', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.fail('Returned unexpected 200 response');
		},
		response404: message => {
			test.fail('Returned unexpected 404 response');
		},
		redirect: path => {
			test.is(path, '/');
		}
	}, '/vehicle/').then(test.end);
});
test.cb('Vehicle Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.fail('Returned unexpected 200 response');
		},
		response404: message => {
			test.is(message, "Can't find vehicle train3");
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/vehicle/net1/route1/train3').then(test.end);
});

/** Unknown Type **/
test.cb('Page Not Found', test => {
	function getTemplate(id) {
		test.fail(`Unexpected template id '${id}' used`);
	}
	Controller(getTemplate).serve({
		response200: (html, headers) => {
			test.fail('Returned unexpected 200 response');
		},
		response404: message => {
			test.is(message, "Page not found");
		},
		redirect: path => {
			test.fail('Returned unexpected redirect');
		}
	}, '/smartypants').then(test.end);
});