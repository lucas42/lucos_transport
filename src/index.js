var express = require('express');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/../templates');

var wrapperTemplate = require('fs').readFileSync(app.get('views')+'/page.'+app.get('view engine'), "utf-8");
var mustacheEngine = require('mustache-express')();

/**
 * wrappedEngine
 *
 * Any time mustache-express is used, wrap the output in a standard template
 */
function wrappedEngine(templatePath, options, callback) {
	mustacheEngine(templatePath, options, function (err, content) {
		options.content = content;
		if (options.title && options.title != "TFLuke") {
			options.headtitle = "TFLuke - " + options.title;
		} else {
			options.headtitle = "TFLuke";
		}
		var output = require('mustache').render(wrapperTemplate, options);
		callback(err, output);
	});
}
app.engine('html', wrappedEngine);

var Route = require('./classes/route');
app.get('/', function(req, res) {
	res.set('Cache-Control', 'public, max-age=0');
	res.render('routes', {
		routes: Route.getRouteList(),
		routeData: JSON.stringify(Route.getRouteList(true)),
		lastUpdated: Route.getOldestUpdateTime(),
		cssClass: 'homepage',
		classType: 'RouteList',
		title: 'TFLuke',
	});
});
app.get('/route/:network/:id?', function (req, res) {
	var route = Route.getById([req.params.network, req.params.id]);
	if (route) {
		route.attemptRefresh(function () {
			var data = route.getDataTree();
			data.parent = {
				link: '/',
				name: 'All Routes',
			}
			data.cssClass = 'route '+data.cssClass;
			res.set('Cache-Control', 'public, max-age=0');
			res.render('route', data);
		});
	} else {
		if (!req.params.id) {
			res.set('Cache-Control', 'public, max-age=1800');
			res.redirect('/');
		} else {
			res.set('Cache-Control', 'public, max-age=0');
			res.status(404).send("Can't find route "+req.params.id);
		}
	}
});
var Stop = require('./classes/stop');
app.get('/stop/:network/:id?', function (req, res) {
	var stop = Stop.getById([req.params.network, req.params.id]);
	if (stop) {
		stop.attemptRefresh(function () {
			var data = stop.getDataTree();
			data.parent = {
				link: '/',
				name: 'All Routes',
			}
			res.set('Cache-Control', 'public, max-age=0');
			res.render('station', data);
		});
	} else {
		if (!req.params.id) {
			res.set('Cache-Control', 'public, max-age=1800');
			res.redirect('/');
		} else {
			res.set('Cache-Control', 'public, max-age=0');
			res.status(404).send("Can't find stop "+req.params.id);
		}
	}
});
var Vehicle = require('./classes/vehicle');
app.get('/vehicle/:network/:route/:code', function (req, res) {
	var vehicle = Vehicle.getById([[req.params.network, req.params.route], req.params.code]);
	if (vehicle) {
		vehicle.attemptRefresh(function () {
			var data = vehicle.getDataTree();
			data.parent = {
				link: '/',
				name: 'All Routes',
			}
			res.set('Cache-Control', 'public, max-age=0');
			res.render('vehicle', data);
		});
	} else {
		res.set('Cache-Control', 'public, max-age=0');
		res.status(404).send("Can't find vehicle "+req.params.code);
	}
});
var Network = require('./classes/network');
var Platform = require('./classes/platform');
var Event = require('./classes/event');
app.get('/data.json', function (req, res) {
	var output = {
		networks: Network.getAllSerialised(),
		routes: Route.getAllSerialised(),
		stops: Stop.getAllSerialised(),
		platforms: Platform.getAllSerialised(),
		vehicles: Vehicle.getAllSerialised(),
		events: Event.getAllSerialised(),
	};
	res.send(output);
	require('./sources/tfl-unified').refresh();
});
app.get('/resources/style.css', function (req, res) {
	res.sendFile('style.css', {root: __dirname + '/..', maxAge:'2m'});
});
app.get('/resources/fonts/led', function (req, res) {
	res.sendFile('fonts/led.ttf', {root: __dirname + '/..', maxAge:'30m'});
});
app.get('/resources/script.js', function (req, res) {
	res.sendFile('bin/clientscripts.js', {root: __dirname + '/..', maxAge:'2m'});
});
app.get('/serviceworker.js', function (req, res) {
	res.sendFile('bin/serviceworker.js', {root: __dirname + '/..', maxAge:'2m'});
});
app.use('/img', express.static(__dirname + '/../img', {maxAge:'5m'}));
app.use('/resources/templates', express.static(__dirname + '/../templates', {maxAge:'2m'}));
var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});

require('./sources/dlrlondon').start();
require('./sources/tfl-unified').start();
require('./sources/localdata').start();
require('./sources/boatdata').start();