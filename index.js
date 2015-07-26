var express = require('express');
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/templates');

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

app.get('/', function(req, res) {
res.render('lines', {foobar: 'rough'});
});

var server = app.listen(process.env.PORT || 3000, function () {
  console.log('App listening at http://%s:%s', server.address().address, server.address().port);
});