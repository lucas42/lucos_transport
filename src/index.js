var express = require('express');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/../templates');
const readFile = require('fs-readfile-promise');
const TFLFetcher = require('./fetchers/tfl.js');
const NRFetcher = require('./fetchers/nr.js');
const Controller = require('./controller')(templateid => {
	var templatePath = app.get('views')+'/'+templateid+'.'+app.get('view engine');
	return readFile(templatePath, "utf-8");
}, (source, type, id, params) => {
	switch(source) {
		case 'tfl':
			return TFLFetcher.fetch(type, id, params);
		case 'nr':
			return NRFetcher.fetch(type, id, params);
	}
});
app.get('*', function(req, res, next) {
	Controller.process(req.path, {accept: req.get("accept")}, req.query).then(result => {
		switch (result.action) {
			case 'response':
				res.set(result.headers).send(result.body);
				break;
			case 'redirect':
				res.redirect(result.path);
				break;
			case 'notfound':
				res.status(404).send(result.message);
				break;
			case 'unknown':
				next();
				break;
			default:
				throw `Unexpected action from controller ${result.action}`;
		}
	}).catch(error => {
		if ('message' in error) error.message = `[${(new Date()).toISOString()}] ${error.message}`;
		if (error.type == "request-timeout") {
			console.error(error.message);
			res.status(502).send("A request to an upstream timed out.  Please try again later.");
		} else {
			console.trace(error);
			res.status(500).send("An error occurred: "+error);
		}
	});
});
var Route = require('./classes/route');
var Stop = require('./classes/stop');
var Vehicle = require('./classes/vehicle');
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
app.get('/_info', function (req, res) {
	const output = {
		system: 'tfluke_app',
		checks: {
			/*"tfl-api": {
				techDetail: "Can connect to tfl API",
			}*/
		},
		metrics: {},
		ci: {
			circle: "gh/lucas42/lucos_transport",
		}
	};
	TFLFetcher.fetch('route', 'victoria').then(() => {
		output.checks['tfl-api'].ok = true;
	}).catch(error => {

		/** HACK: This check is really quite noisey, so hide it from output for now if it fails **/
		delete output.checks['tfl-api'];
		//output.checks['tfl-api'].ok = false;
		//output.checks['tfl-api'].debug = error.message;
	}).then(() => {
		res.send(output);
	});
});
app.use('/img', express.static(__dirname + '/../img', {maxAge:'5m'}));
app.use('/resources/templates', express.static(__dirname + '/../templates', {maxAge:'2m'}));
var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});
app.get('/simple', function (req, res) {
	
})

require('./sources/localdata').start();
require('./sources/boatdata').start();