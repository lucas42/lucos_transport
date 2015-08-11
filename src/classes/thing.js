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
		var instance = getCreate(id);
		instance.setData(data);
		return instance;
	}
	function getById(id) {
		if (id in all) {
			return all[id];
		}
		return null;
	}
	function getCreate(id) {
		var instance;
		if (id in all) {
			instance = all[id];
		} else {
			instance = new Class(id);
			all[id] = instance;
		}
		return instance;
	}
	function getAll() {
		var output = [];
		for (var id in all) {
			output.push(all[id]);
		}
		return output;
	}
	function getByRelatedThing(relation, thing) {
		var relations, relatedinstance, output = [];
		for (var id in all) {
			relatedthings = all[id].relations[relation].get();
			for (var i = 0; i < relatedthings.length; i++) {
				if (relatedthings[i] == thing) {
					output.push(all[id]);
					continue;
				}
			}
		}
		return output;
	}
	Class.prototype = new Thing();
	Class.prototype.constructor = Class;
	Class.update = update;
	Class.getById = getById;
	Class.getAll = getAll;
	Class.getByRelatedThing = getByRelatedThing;
	Class.getCreate = getCreate;
}
/**
 * relation params:
 * singular - string (mandatory)
 * plural - string (defaults to singular plus 's')
 * source - string (optional)
 * sort - function (optional)
 * symmetrical - boolean (defaults to false)
 **/
Thing.prototype.addRelation = function addRelation(relation) {
	if (typeof relation == "string") {
			relation = {
			singular: relation,
		};
	}
	if (!relation.singular) throw "relation needs singular";
	if (!relation.plural) relation.plural = relation.singular+"s";
	var instances = {};
	var thisinstance = this;
	function addThing(instance) {
		var wasthere = instance.getId() in instances;
		instances[instance.getId()] = instance;
		if (relation.symmetrical && !wasthere && thisinstance != instance) {
			instance.relations[relation.singular].add(thisinstance);
		}  
	}
	function getThings() {
		var output = [];
		for (var i in instances) output.push(instances[i]);
		if (relation.sort) output.sort(relation.sort);
		return output;
	}
	relation.add = addThing;
	relation.get = getThings;
	this.relations[relation.singular] = relation;
	var singular = relation.singular.charAt(0).toUpperCase() + relation.singular.slice(1);
	var plural = relation.singular.charAt(0).toUpperCase() + relation.plural.slice(1);
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
		if (relation.symmetrical) continue;
		var relateddata = [];
		relation.get().forEach(function (relatedthing) {
			relateddata.push(relatedthing.getDataTree(relation.source));
		});
		output[relation.plural] = relateddata;
	}
	return output;
}

module.exports = Thing;