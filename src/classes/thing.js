function Thing(id) {
	var data = {};
	this.setData = function setData(newdata) {
		data = newdata;
	};
	this.getRawData = function getRawData() {
		var output = {};
		for (var i in data) {
			output[i] = data[i];
		}
		return output;
	}
	this.getField = function getField(key) {
		return data[key];
	}
	this.setField = function setField(key, val) {
		data[key] = val;
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
	this.relations = {};
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
Thing.prototype.addRelation = function addRelation(singular, plural, source) {
	if (!plural) plural = singular+"s";
	var instances = {};
	function addThing(instance) {
		instances[instance.getId()] = instance;
	}
	function getThings() {
		var output = [];
		for (var i in instances) output.push(instances[i]);
		return output;
	}
	this.relations[singular] = {
		singular: singular,
		plural: plural,
		source: source,
		add: addThing,
		get: getThings,
	}
	singular = singular.charAt(0).toUpperCase() + singular.slice(1);
	plural = singular.charAt(0).toUpperCase() + plural.slice(1);
	this['add'+singular] = addThing;
	this['get'+plural] = getThings;
}

/**
 * Get data about the object and all its related objects recursively
 */
Thing.prototype.getDataTree = function getDataTree(source) {
	var output = this.getData(source);
	for (var i in this.relations) {
		var relation = this.relations[i];
		var relateddata = [];
		relation.get().forEach(function (relatedthing) {
			relateddata.push(relatedthing.getDataTree(relation.source));
		});
		output[relation.plural] = relateddata;
	}
	return output;
}

module.exports = Thing;