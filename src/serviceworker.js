const RESOURCE_CACHE = 'resources-v1';
const TEMPLATE_CACHE = 'templates-v1';
const TEMPLATE_PATH = '/resources/templates/';

const Event = require('./classes/event'),
serverSource = require('./sources/server'),
Pubsub = require('lucos_pubsub');

self.addEventListener('install', function swInstalled(event) {
	event.waitUntil(refreshResources());
});

function refreshResources() {
	let errors = [];
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
		errors.push("resources");
	}).then(function () {
		return caches.open(TEMPLATE_CACHE).then(function addTemplateUrlsToCache(cache) {
			return cache.addAll([
				TEMPLATE_PATH + 'page.html',
				TEMPLATE_PATH + 'routes.html',
				TEMPLATE_PATH + 'route.html',
				TEMPLATE_PATH + 'station.html',
				TEMPLATE_PATH + 'vehicle.html',
				TEMPLATE_PATH + 'loading.html',
			]);
		});
	}).catch(function (error) {
		errors.push("templates");
	}).then(serverSource.refresh).catch(function (error) {
		errors.push("data");
	}).then(function () {
		if (errors.length) throw "Failed to update "+errors.join()+".";
	})
}

const Controller = require('./controller')(templateid => {
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
		});
	});
}, true);

/**
 * Keep track of whether there are any ongoing fetches
 * Event updates are processor intensive, so only enable them when there are no fetches
 */
var fetchCounter = (function () {
	var currentFetches = 0;
	return {
		increment: function increment() {
			currentFetches++;
			Event.setUpdatesEnabled(false);
		},
		decrement: function decrement() {
			currentFetches--;
			setTimeout(() => {
				if (currentFetches == 0) Event.setUpdatesEnabled(true);
			}, 300);
		},
	}
})();

self.addEventListener('fetch', function respondToFetch(event) {
	fetchCounter.increment();
	var url = new URL(event.request.url);
	var responsePromise = caches.match(event.request).then(function serveFromCache(response) {
		if (response) return response;
		var tokens = url.pathname.split('/');
		if (tokens[1] == 'refresh') {
			var refreshCommand = (tokens[2] == 'all') ? refreshResources : serverSource.refresh;
			return refreshCommand().then(function () {
				return new Response(null, {status: 204});
			}).catch(function (error) {
				return new Response(new Blob([error]), {status: 502});
			});
		}
		if (!serverSource.isLoaded()) {
			serverSource.loadFromCache();
			return render('loading', {}, {

				// Use a really fast meta-refresh to check for changes
				'refresh': '0.01',
			});
		}
		return Controller.process(url.pathname).then(result => {
			switch (result.action) {
				case 'response':
					return new Response(new Blob([result.body]), {headers: result.headers});
					break;
				case 'redirect':
					return Response.redirect(result.path);
				case 'notfound':
					return new Response(new Blob([result.message]), {status: 404});
				case 'unknown':
					return fetch(event.request.url);
				default:
					throw `Unexpected action from controller ${result.action}`;
			}
		});
	}).catch(error => {
		console.error("Can't do response", error);
		return new Response(new Blob(["An unknown error occured"]), {status: 500});
	});
	var tidyUpResponsePromise = responsePromise.then(response => {
		setTimeout(fetchCounter.decrement, 0);
		return response;
	})
	event.respondWith(tidyUpResponsePromise);
});

Pubsub.filterBroadcasts((type, msg, client) => {
	var url = new URL(client.url);
	switch (type) {
		case 'eventApproaching':
		case 'eventArrived':
		case 'updateEventTime':
			return (url.pathname == msg.vehiclelink || url.pathname == msg.platformlink);
		default:
			return false;
	}
});
serverSource.start();