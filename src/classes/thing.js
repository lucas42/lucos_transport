function Thing(id) {
	var data = {};
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
Thing.prototype.getData = function getData() {
	var output = this.getRawData();
	return output;
}

Thing.extend = function extend(Class) {
	var all = {};
	function update(id, data) {
		var instance;
		if (id in all) {
			instance = all[id];
		} else {
			instance = new Class(id);
			all[id] = instance;
		}
		instance.setData(data);
		return instance;
	}
	function getById(id) {
		if (id in all) {
			return all[id];
		}
		return null;
	}
	function getAll() {
		return all;
	}
	Class.prototype = new Thing();
	Class.prototype.constructor = Class;
	Class.update = update;
	Class.getById = getById;
	Class.getAll = getAll;
}

module.exports = Thing;