var express = require('express');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/../templates');

var wrapperTemplate = require('fs').readFileSync(app.get('views')+'/page.'+app.get('view engine'), "utf-8");
var mustacheEngine = require('mustache-express')();

/**
 * wrappedEngine
 *
 * Any time mustache-express is used, wrapped the output in a standard template
 */
function wrappedEngine(templatePath, options, callback) {
	mustacheEngine(templatePath, options, function (err, content) {
		options.content = content;
		var output = require('mustache').render(wrapperTemplate, options);
		callback(err, output);
	});
}
app.engine('html', wrappedEngine);

var Route = require('./classes/route');
app.get('/', function(req, res) {
	var routedata = [];
	var routes = Route.getAll();
	for (i in routes) {
		routedata.push(routes[i].getData());
	}
	res.render('lines', {lines: routedata});
});
app.get('/route/:id', function (req, res) {
	var route = Route.getById(req.params.id);
	if (route) {
		var data = route.getData();
		data.parent = {
			link: '/',
			name: 'All Routes',
		}
		res.render('line', data);
	} else {
		res.status(404).send("Can't find route");
	}
})
app.get('/resources/style.css', function (req, res) {
	res.sendFile('style.css', {root: __dirname + '/..'});
});

var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});

require('./trackernet').start();