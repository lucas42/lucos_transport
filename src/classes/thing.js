function Thing(id) {
	var data = {};
	this.setData = function setData(newdata) {
		data = newdata;
	};
	this.getRawData = function getRawData() {
		var output = {};
		for (i in data) {
			output[i] = data[i];
		}
		return output;
	}
	this.getField = function getField(key) {
		return data[key];
	}
	this.getId = function getId() {
		return id;
	}
	var lastRefresh = null;
	this.attemptRefresh = function attemptRefresh(callback) {
		if (!callback) callback = function(){};
		if (!this.refresh || Date.now() - lastRefresh < 30000) {
			callback();
			return;
		}
		console.log("Refreshing "+data.title);
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
Thing.addRelation = function addRelation(thing, singular, plural) {
	if (!plural) plural = singular+"s";
	singular = singular.charAt(0).toUpperCase() + singular.slice(1);
	plural = singular.charAt(0).toUpperCase() + plural.slice(1);
	var instances = {};
	thing['add'+singular] = function addThing(instance) {
		instances[instance.getId()] = instance;
	}
	thing['get'+plural] = function getThings() {
		var output = [];
		for (i in instances) output.push(instances[i]);
		return output;
	}
}

module.exports = Thing;