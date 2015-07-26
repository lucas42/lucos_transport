routes = {};
function Route(id) {
	var data = {};
	routes[id] = this;
	this.setData = function (newdata) {
		data = newdata;
	};
	this.getData = function () {
		var output = {};
		for (i in data) {
			output[i] = data[i];
		}
		output.link = "/route/"+id;
		output.cssClass = data.name.replace(/[ &]|and/g,'').toLowerCase();
		output.title = data.name + " Line";
		return output;
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
Route.getById = function getById(id) {
	if (id in routes) {
		return routes[id];
	}
	return null;
}
Route.getAll = function getAll() {
	return routes;
}

module.exports = Route