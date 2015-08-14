function BaseThing() {}
function Class(classname, keynames, constructor) {

	if (typeof keynames == "string") keynames = [keynames];
	var all = {};
	function update(index, data) {
		var instance = new SpecificThing(index);
		instance.setData(data);
		return instance;
	}
	function getByIndex(index) {
		if (index in all) {
			return all[index];
		}
		return null;
	}
	function getCreate(index) {
		return new Class(index);
	}
	function getAll() {
		var output = [];
		for (var key in all) {
			output.push(all[key]);
		}
		return output;
	}
	function getByRelatedThing(relation, thing) {
		var relations, relatedinstance, output = [];
		for (var key in all) {
			relatedthings = all[key].relations[relation].get();
			for (var i = 0; i < relatedthings.length; i++) {
				if (relatedthings[i] == thing) {
					output.push(all[key]);
					continue;
				}
			}
		}
		return output;
	}
	function SpecificThing() {
		var instance = this;
		var keylist = arguments;
		var index = [];
		var keys = {};

		keynames.forEach(function(keyname, i) {
			var key = keylist[i];
			if (typeof key == "undefined") throw new Error("Missing "+keyname+" argument for "+classname);
			keys[keyname] = key;
			if (key instanceof BaseThing) index[i] = key.getIndex();
			else index[i] = key;
			function getKey() {
				return key;
			}
			instance["get"+capitalise(keyname)] = getKey;
		});

		// Only allow one object in each Class with a given index
		if (index in all) {
			return all[index];
		}
		all[index] = instance;

		var data = {};
		instance.setData = function setData(newdata) {
			data = newdata;
		};
		instance.getRawData = function getRawData() {
			var output = {};
			for (var i in data) {
				output[i] = data[i];
			}
			return output;
		}
		instance.getField = function getField(key) {
			return data[key];
		}
		instance.setField = function setField(key, val) {
			data[key] = val;
		}
		instance.getIndex = function getIndex() {
			return index;
		}

		// Removes the object from the list of all instances in the class
		// References may remain to the object in other places
		instance.deleteFromAll = function deleteFromAll() {
			delete all[index];
		}
		var lastRefresh = null;
		instance.attemptRefresh = function attemptRefresh(callback) {
			if (!callback) callback = function(){};
			if (!instance.refresh || Date.now() - lastRefresh < 30000) {
				callback();
				return;
			}
			console.log("Refreshing "+data.title);
			instance.refresh.call(instance, function () {
				lastRefresh = Date.now();
				callback();
			});
		};
		instance.relations = {};
		if (constructor) constructor.apply(instance);
	}
	SpecificThing.prototype = Object.create(BaseThing.prototype);
	SpecificThing.prototype.constructor = SpecificThing;
	SpecificThing.update = update;
	SpecificThing.getById = getByIndex;
	SpecificThing.getAll = getAll;
	SpecificThing.getByRelatedThing = getByRelatedThing;
	SpecificThing.getCreate = getCreate;

	// Attempt to change the name of the constructor, to aid debugging in stacktraces and console output
	try {
		Object.defineProperty(SpecificThing.constructor, 'name', {writable: true});
		SpecificThing.constructor.name = classname;
	} catch (e) {
		// Probably doesn't support ECMA 6.  No need to do anything, but debug is just going to be full of references to "SpecificThing"
	}

	SpecificThing.prototype.getData = function getData() {
		var output = this.getRawData();
		return output;
	}
	/**
	 * relation params:
	 * singular - string (mandatory)
	 * plural - string (defaults to singular plus 's')
	 * sort - function (optional)
	 * symmetrical - boolean (defaults to false)
	 * nofollow - boolean (defaults to false, unless symmetrical in which case is always true)
	 **/
	SpecificThing.prototype.addRelation = function addRelation(relation) {
		if (typeof relation == "string") {
				relation = {
				singular: relation,
			};
		}
		if (!relation.singular) throw new Error("relation needs singular");
		if (!relation.plural) relation.plural = relation.singular+"s";
		var instances = {};
		var thisinstance = this;
		function hasThing(instance) {
			return instance.getIndex() in instances;
		}
		function addThing(instance) {
			if (hasThing(instance)) return;
			instances[instance.getIndex()] = instance;
			if (relation.symmetrical && thisinstance != instance) {
				instance.relations[relation.singular].add(thisinstance);
			}  
		}
		function removeThing(instance) {
			if (!hasThing(instance)) return;
			delete instances[instance.getIndex()];
			if (relation.symmetrical && thisinstance != instance) {
				instance.relations[relation.singular].remove(thisinstance);
			}
		}
		function getThings() {
			var output = [];
			for (var i in instances) output.push(instances[i]);
			if (relation.sort) output.sort(relation.sort);
			return output;
		}
		if (relation.symmetrical) relation.nofollow = true;
		relation.has = hasThing;
		relation.add = addThing;
		relation.remove = removeThing;
		relation.get = getThings;
		relation.source = classname;
		this.relations[relation.singular] = relation;
		this['has'+capitalise(relation.singular)] = hasThing;
		this['add'+capitalise(relation.singular)] = addThing;
		this['remove'+capitalise(relation.singular)] = removeThing;
		this['get'+capitalise(relation.plural)] = getThings;
	}

	/**
	 * Get data about the object and all its related objects recursively
	 */
	SpecificThing.prototype.getDataTree = function getDataTree(source) {
		var output = this.getData(source);
		for (var i in this.relations) {
			var relation = this.relations[i];

			// If nofollow is true, then only include relations from the root of the tree
			if (source && relation.nofollow) continue;
			var relateddata = [];
			relation.get().forEach(function (relatedthing) {
				relateddata.push(relatedthing.getDataTree(relation.source));
			});
			output[relation.plural] = relateddata;
		}
		return output;
	}
	return SpecificThing;
}
function capitalise(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = Class;