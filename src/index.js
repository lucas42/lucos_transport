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
		var route = routes[i].getData();
		route.link = "/route/"+i;
		route.cssClass = route.name.replace(/[ &]|and/g,'').toLowerCase();
		routedata.push(route);
	}
	res.render('lines', {lines: routedata});
});
app.get('/resources/style.css', function (req, res) {
	res.sendFile('style.css', {root: __dirname + '/..'});
});

var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});

require('./trackernet').start();