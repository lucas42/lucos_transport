const RESOURCE_CACHE = 'resources-v1';

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
	});
}

self.addEventListener('fetch', function respondToFetch(event) {
	console.log('fetch', event.request);
	var responsePromise = caches.match(event.request).then(function serveFromCache(response) {
		if (response) return response;
		else return fetch(event.request);
	});
	event.respondWith(responsePromise);

	// When the main page is requested, try updating the resources from the network asynchronously.
	if (event.request.url.pathname == "/") {
		responsePromise.then(refreshResources);
	}
});