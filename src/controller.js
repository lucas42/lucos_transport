const Route = require('./classes/route'),
Stop = require('./classes/stop'),
Vehicle = require('./classes/vehicle'),
Mustache = require('mustache');

function Controller (getTemplate, dataFetcher, isServiceWorker) {
	if (typeof getTemplate != 'function') throw "Needs getTemplate function";
	function process (path, requestHeaders) {
		if (!requestHeaders) requestHeaders = {};
		var parts = path.split('.', 2);
		var tokens = parts[0].split('/');
		var extension = parts[1];
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
				return render('vehicle', data, {
					'Cache-Control': 'public, max-age=0'
				});
			case 'loading':

				// No point showing the loading page on server rendered pages.
				if (!isServiceWorker) {
					return Promise.resolve({action:'redirect', path:'/'});
				}
				return render('loading', null, {
					'Cache-Control': 'public, max-age=0',

					// Use a really fast meta-refresh to check for changes
					'refresh': '0.01',
				});
			case 'tfl':
			case 'nr':
				let source = tokens[1];
				let type = tokens[2] || 'routes';
				let id = tokens[3];
				return dataFetcher(source, type, id).then(data => {
					if (extension == "json") {
						return {
							action: 'response',
							body: data,
							headers: {
								'Cache-Control': 'public, max-age=0',
								'Content-Type': "application/json; charset=utf-8",
							},
						};
					}
					return render(type, data, {
						'Cache-Control': 'public, max-age=0'
					});
				}).catch(error => {
					if (error == 'notfound') {
						return Promise.resolve({action:'notfound', message:`Can't find ${type}`});
					}
					throw error;
				})
			default:
				return Promise.resolve({action:'unknown'});
		}
		function populateTemplate(templateid, data) {
			return getTemplate(templateid).then(template => {
				return Mustache.render(template, data);
			});
		}
		function render(templateid, options, responseHeaders) {
			if (!options) options = {};
			if (!responseHeaders) responseHeaders = {};
			options.isServiceWorker = !!isServiceWorker;
			return populateTemplate(templateid, options).then(content => {
				if (requestHeaders.accept == "text/partial-html") {
					['title','classID','classType','cssClass','lastUpdated', 'routeData'].forEach(field => {
						if (field in options) responseHeaders[field] = options[field];
					});
					responseHeaders['Content-Type'] = "text/partial-html; charset=utf-8";
					return content;
				} else {
					options.content = content;
					if (options.title && options.title != "TFLuke") {
						options.headtitle = "TFLuke - " + options.title;
					} else {
						options.headtitle = "TFLuke";
					}
					return populateTemplate('page', options);
				}
			}).then(html => {
				if (!responseHeaders['Content-Type']) responseHeaders['Content-Type'] = "text/html; charset=utf-8";
				return {
					action: 'response',
					body: html,
					headers: responseHeaders,
				};
			});
		}
	}
	return {
		process: process,
	}
}
module.exports = Controller;