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
	var routedata = [];
	var routes = Route.getAllSorted();
	for (var i in routes) {
		routedata.push(routes[i].getData());
	}
	res.render('routes', {
		routes: routedata,
		cssClass: 'homepage',
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
			res.render('route', data);
		});
	} else {
		if (!req.params.id) {
			res.redirect('/');
		} else {
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
			res.render('station', data);
		});
	} else {
		if (!req.params.id) {
			res.redirect('/');
		} else {
			res.status(404).send("Can't find stop "+req.params.id);
		}
	}
});
var Vehicle = require('./classes/vehicle');
app.get('/vehicle/:id', function (req, res) {
	var vehicle = Vehicle.getById(req.params.id);
	if (vehicle) {
		vehicle.attemptRefresh(function () {
			var data = vehicle.getDataTree();
			data.parent = {
				link: '/',
				name: 'All Routes',
			}
			res.render('vehicle', data);
		});
	} else {
		res.status(404).send("Can't find vehicle "+req.params.id);
	}
});
app.get('/resources/style.css', function (req, res) {
	res.sendFile('style.css', {root: __dirname + '/..'});
});
app.get('/resources/fonts/led', function (req, res) {
	res.sendFile('fonts/led.ttf', {root: __dirname + '/..'});
});
app.use('/img', express.static(__dirname + '/../img'));
var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});

require('./sources/trackernet').start();
require('./sources/localdata').start();