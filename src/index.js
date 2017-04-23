var express = require('express');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/../templates');
const readFile = require('fs-readfile-promise');
const Controller = require('./controller')(templateid => {
	var templatePath = app.get('views')+'/'+templateid+'.'+app.get('view engine');
	return readFile(templatePath, "utf-8");
});
app.get('*', function(req, res, next) {
	Controller.serve({
		response200: (html, headers) => {
			res.set(headers).send(html);
		},
		response404: message => {
			if (message == "Page not found") next();
			else res.status(404).send(message);
		},
		redirect: path => {
			res.redirect(path);
		}
	}, req.path);
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
app.use('/img', express.static(__dirname + '/../img', {maxAge:'5m'}));
app.use('/resources/templates', express.static(__dirname + '/../templates', {maxAge:'2m'}));
var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});

require('./sources/dlrlondon').start();
require('./sources/tfl-unified').start();
require('./sources/localdata').start();
require('./sources/boatdata').start();