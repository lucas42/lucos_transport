const RESOURCE_CACHE = 'resources-v1';
const TEMPLATE_CACHE = 'templates-v1';
const TEMPLATE_PATH = '/resources/templates/';

const Route = require('./classes/route'),
serverSource = require('./sources/server'),
Mustache = require('mustache');

self.addEventListener('install', function swInstalled(event) {
	event.waitUntil(refreshResources());
});


function refreshResources() {
	return caches.open(RESOURCE_CACHE).then(function addUrlsToCache(cache) {
		return cache.addAll([
			'/resources/style.css',
			'/resources/fonts/led',
			'/resources/script.js',
			'/img/roundel-tube.png',
			'/img/roundel-dlr.png',
			'/img/roundel-overground.png',
		]);
	}).catch(function (error) {
		console.error("Failed to cache resources:", error.message);
	}).then(function () {
		caches.open(TEMPLATE_CACHE).then(function addTemplateUrlsToCache(cache) {
			return cache.addAll([
				TEMPLATE_PATH + 'page.html',
			]);
		});
	}).catch(function (error) {
		console.error("Failed to cache templates:", error.message);
	}).then(serverSource.refresh);
}

self.addEventListener('fetch', function respondToFetch(event) {
	var url = new URL(event.request.url);
	var responsePromise = caches.match(event.request).then(function serveFromCache(response) {
		if (response) return response;
		var tokens = url.pathname.split('/');
		switch (tokens[1]){
			case '':
				return render('routes', {
					routes: Route.getAllData(),
					cssClass: 'homepage',
					title: 'TFLuke',
				});
			case 'route':
				if (!tokens[2]) {
					return Response.redirect('/');
				}
				var route = Route.getById([tokens[2], tokens[3]]);
				if (!route) {
					return new Response(new Blob(["Can't find route /"+tokens[2]+'/'+tokens[3]]), {status: 404});
				}
				var data = route.getDataTree();
				data.parent = {
					link: '/',
					name: 'All Routes',
				}
				data.cssClass = 'route '+data.cssClass;
				return render('route', data);
			case 'refresh':
				return refreshResources().then(function () {
					return new Response(null, {status: 204});
				}).catch(function (error) {
					return new Response(new Blob([error]), {status: 502});
				})
		}
		return fetch(event.request.url);
	});
	event.respondWith(responsePromise);
});

function populateTemplate(templateid, data) {
	return caches.open(TEMPLATE_CACHE).then(function getTemplate(cache) {
		var templateRequest = new Request(TEMPLATE_PATH + templateid + '.html');
		return cache.match(templateRequest).then(function (fromCache) {
			if (fromCache) return fromCache;
			return fetch(templateRequest).then(templateResponse => {
				cache.put(templateRequest, templateResponse.clone());
				return templateResponse;
			});
		}).then(templateResponse => {
			return templateResponse.text();
		}).then(template => {
			return Mustache.render(template, data);
		});
	});
}
function render(templateid, options) {
	options.isServiceWorker = true;
	return populateTemplate(templateid, options).then(content => {
		options.content = content;
		if (options.title && options.title != "TFLuke") {
			options.headtitle = "TFLuke - " + options.title;
		} else {
			options.headtitle = "TFLuke";
		}
		return populateTemplate('page', options);
	}).then(html => {
		return new Response(new Blob([html]));
	});
}


serverSource.start();