routes = {};
function Route(id) {
	var data = {};
	routes[id] = this;
	this.setData = function (newdata) {
		data = newdata;
	};
	this.getRawData = function () {
		var output = {};
		for (i in data) {
			output[i] = data[i];
		}
		return output;
	}
	this.getId = function getId() {
		return id;
	}
}
Route.prototype.getData = function getData() {
	var output = this.getRawData();
	output.link = "/route/"+this.getId();
	output.cssClass = "route_"+output.name.replace(/[ &]|and/g,'').toLowerCase();
	output.title = output.name + " Line";
	return output;
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