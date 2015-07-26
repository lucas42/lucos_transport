routes = {};
function Route(id) {
	var data = {};
	routes[id] = this;
	this.setData = function (newdata) {
		data = newdata;
	};
	this.getData = function () {
		return data;
	}
}

Route.update = function update(id, data) {
	var route;
	if (id in routes) {
		route = routes[id];
	} else {
		route = new Route(id);
	}
	route.setData(data);
}
Route.getAll = function getAll() {
	return routes;
}

module.exports = Route