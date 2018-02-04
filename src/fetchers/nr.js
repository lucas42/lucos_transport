module.exports = {
	fetch: function (type, id, params) {
		switch (type) {
			case "routes":
				return Promise.resolve({
					routes: [],
					lastUpdated: Date.now(),//Route.getOldestUpdateTime(),
					cssClass: 'homepage',
					classType: 'RouteList',
					title: 'National Rail Services',
				});
			default:
				return Promise.reject("Fetching National Rail data not yet implemented");
		}
	}
}