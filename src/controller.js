const Route = require('./classes/route'),
Stop = require('./classes/stop'),
Vehicle = require('./classes/vehicle'),
Mustache = require('mustache');

function Controller (getTemplate, isServiceWorker) {
	if (typeof getTemplate != 'function') throw "Needs getTemplate function";
	function process (path) {
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
					return Promise.resolve({action:'redirect', path:'/'});
				}
				var route = Route.getById([tokens[2], tokens[3]]);
				if (!route) {
					return Promise.resolve({action:'notfound', message:`Can't find route /${tokens[2]}/${tokens[3]}`});
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
					return Promise.resolve({action:'redirect', path:'/'});
				}
				var stop = Stop.getById([tokens[2], tokens[3]]);
				if (!stop) {
					return Promise.resolve({action:'notfound', message:`Can't find stop /${tokens[2]}/${tokens[3]}`});
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
					return Promise.resolve({action:'redirect', path:'/'});
				}
				var vehicle = Vehicle.getById([[tokens[2], tokens[3]], tokens[4]]);
				if (!vehicle) {
					return Promise.resolve({action:'notfound', message:`Can't find vehicle ${tokens[4]}`});
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
				return Promise.resolve({action:'unknown'});
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
				return {
					action: 'response',
					body: html,
					headers: headers,
				};
			});
		}
	}
	return {
		process: process,
	}
}
module.exports = Controller;