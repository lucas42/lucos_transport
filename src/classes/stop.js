stops = {};
function Stop(id) {
	var data = {};
	stops[id] = this;
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
	var lastRefresh = null;
	this.attemptRefresh = function attemptRefresh(callback) {
		console.log("Refreshing "+data.title);
		if (!this.refresh || Date.now() - lastRefresh < 30000) {
			callback();
			return;
		}
		this.refresh.call(this, function () {
			lastRefresh = Date.now();
			callback();
		});
	};
}
Stop.prototype.getData = function getData() {
	var output = this.getRawData();
	return output;
}

Stop.update = function update(id, data) {
	var stop;
	if (id in stops) {
		stop = stops[id];
	} else {
		stop = new Stop(id);
	}
	stop.setData(data);
	return stop;
}
Stop.getById = function getById(id) {
	if (id in stops) {
		return stops[id];
	}
	return null;
}
Stop.getAll = function getAll() {
	return stops;
}

module.exports = Stop;