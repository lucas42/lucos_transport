const Route = require('./classes/route'),
Stop = require('./classes/stop'),
Vehicle = require('./classes/vehicle'),
Mustache = require('mustache');

function Controller (getTemplate, isServiceWorker) {
	if (typeof getTemplate != 'function') throw "Needs getTemplate function";
	function serve (functions, path) {
		if (typeof functions != 'object') throw "Needs utility functions"
		var utilityfunctions = {};
		["response200","response404","redirect"].forEach(funcname => {
			if (typeof functions[funcname] != 'function') throw `Needs {funcname} function`;

			// Wrap the output of each function in a promise
			utilityfunctions[funcname] = function () {
				var response = functions[funcname].apply(null, arguments);
				return Promise.resolve(response);
			};
		});
		var tokens = path.split('/');
		switch (tokens[1]){
			case '':
				return render('routes', {
					routes: Route.getRouteList(),
					routeData: JSON.stringify(Route.getRouteList(true)),
					lastUpdated: Route.getOldestUpdateTime(),
					cssClass: 'homepage',
					classType: 'RouteList',
					title: 'TFLuke',
				}, {
					'Cache-Control': 'public, max-age=0'
				});
			case 'route':
				if (!tokens[2]) {
					return utilityfunctions.redirect('/');
				}
				var route = Route.getById([tokens[2], tokens[3]]);
				if (!route) {
					return utilityfunctions.response404(`Can't find route /${tokens[2]}/${tokens[3]}`);
				}
				var data = route.getDataTree();
				data.parent = {
					link: '/',
					name: 'All Routes',
				}
				data.cssClass = 'route '+data.cssClass;
				return render('route', data, {
					'Cache-Control': 'public, max-age=0'
				});
			case 'stop':
				if (!tokens[2]) {
					return utilityfunctions.redirect('/');
				}
				var stop = Stop.getById([tokens[2], tokens[3]]);
				if (!stop) {
					return utilityfunctions.response404(`Can't find stop /${tokens[2]}/${tokens[3]}`);
				}
				var data = stop.getDataTree();
				data.parent = {
					link: '/',
					name: 'All Routes',
				}
				return render('station', data, {
					'Cache-Control': 'public, max-age=0'
				});
			case 'vehicle':
				if (!tokens[2]) {
					return utilityfunctions.redirect('/');
				}
				var vehicle = Vehicle.getById([[tokens[2], tokens[3]], tokens[4]]);
				if (!vehicle) {
					return utilityfunctions.response404(`Can't find vehicle ${tokens[4]}`);
				}
				var data = vehicle.getDataTree();
				data.parent = {
					link: '/',
					name: 'All Routes',
				}
				return render('vehicle', data, {
					'Cache-Control': 'public, max-age=0'
				});
			default:
				return utilityfunctions.response404(`Page not found`);
		}
		function populateTemplate(templateid, data) {
			return getTemplate(templateid).then(template => {
				return Mustache.render(template, data);
			});
		}
		function render(templateid, options, headers) {
			if (!options) options = {};
			if (!headers) headers = {};
			options.isServiceWorker = !!isServiceWorker;
			return populateTemplate(templateid, options).then(content => {
				options.content = content;
				if (options.title && options.title != "TFLuke") {
					options.headtitle = "TFLuke - " + options.title;
				} else {
					options.headtitle = "TFLuke";
				}
				return populateTemplate('page', options);
			}).then(html => {
				if (!headers['Content-Type']) headers['Content-Type'] = "text/html; charset=utf-8";
				return utilityfunctions.response200(html, headers);
			});
		}
	}
	return {
		serve: serve,
	}
}
module.exports = Controller;