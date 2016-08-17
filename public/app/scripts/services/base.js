'use strict';

angular.module('MobileCRMApp')
.factory('Base', function ($http, $q) {

	// Constructor
	var Base = function (propValues) {
		// Not allow instance of the base class
		if (this.constructor.name === "Base") {
			throw "The base class cannot be instantiated and is only meant to be extended by other classes.";
		}
		// Assign properties or instantiate them
		this.assignProperties(propValues);
	};

	var hiddenProperties = {};
	//Excel variables
	var a = document.createElement("a");
	document.body.appendChild(a);
	//  a.style = "display: none";

	Base.prototype.setHiddenProperties = function (object) {
		for (var property in object) {
			hiddenProperties[property] = object[property];
		}
	}

	Base.prototype.getHiddenProperties = function (property) {
		var resolve = {};
		if (property) {
			var keys = Object.keys(hiddenProperties);
			for (var x in property) {
				if (_.contains(keys, property[x])) {
					resolve[property[x]] = hiddenProperties[property[x]];
				}
			}
			return resolve;
		} else {
			return hiddenProperties
		}
		return (property) ? hiddenProperties[property] : hiddenProperties;
	}

	// Find: Get data and instantiate new objects for existing records from a REST API
	Base.prototype.find = function () {
		var deferred = $q.defer();
		var _this = this.constructor;
		$http.get(this.baseApiPath).success(function (data, status, headers, config) {
			var response = {},
			data = data.data;

			//Create a new object of the current class (or an array of them) and return it (or them)
			if (Array.isArray(data)) {
				response.data = data.map(function (obj) {
						return new _this(obj);
					});
				//Add "delete" method to results object to quickly delete objects and remove them from the results array
				response.delete  = function (object) {
					object.delete ().then(function () {
						return response.data.splice(response.data.indexOf(object), 1);
					});
				};
			} else {
				response = new _this(data);
			}
			return deferred.resolve(response);
		}).error(function (data, status, headers, config) {
			return deferred.reject(data);
		});
		return deferred.promise;
	};

	// Find: Get data and instantiate new objects for existing records from a REST API
	Base.prototype.findById = function (id) {
		var deferred = $q.defer(),
		_this = this.constructor;
		//    console.log(params, 'params');
		$http.get(this.baseApiPath + '?id=' + id).success(function (data, status, headers, config) {
			var response = {},
			data = data.data;

			//Create a new object of the current class (or an array of them) and return it (or them)
			if (Array.isArray(data)) {
				response.data = data.map(function (obj) {
						return new _this(obj);
					});
				//Add "delete" method to results object to quickly delete objects and remove them from the results array
				response.delete  = function (object) {
					object.delete ().then(function () {
						return response.data.splice(response.data.indexOf(object), 1);
					});
				};
			} else {
				response = new _this(data);
			}
			return deferred.resolve(response);
		}).error(function (data, status, headers, config) {
			return deferred.reject(data);
		});
		return deferred.promise;
	};

	var validate = function () {
		return true;
	};

	Base.prototype.validate = validate;

	Base.prototype.assignProperties = function (data) {

		// Variables
		var _this = this;

		//
		data = convertToDate(data);
		// Functions

		// Look for the property value
		var getPropertyValue = function (_defaultValue, _value) {

			// Check if this property should be an instance of another class
			if (_defaultValue != null && typeof _defaultValue === "function") {

				// Check if it is just an insance or an array of instances
				if (Array.isArray(_value)) {
					return _value.map(function (obj) {
						return new _defaultValue(obj);
					});
				} else {
					return new defaultValue(_value);
				}

				// If it is not an instance just assign everything
			} else if (typeof _value == "object") {
				return convertToDate(_value);
			} else {
				return _value;
			}
		};

		// Business Logic
		if (data == null) {
			data = {};
		}

		var properties = this.constructor.properties();

		// Look for each property in the class
		for (var key in data) {

			// Get default value / constructor
			var defaultValue = properties[key];

			_this[key] = getPropertyValue(defaultValue, data[key]);
		};
		this.setHiddenProperties({
			validate : validate
		});

		// return the incoming data in case some other function wants to play with it next
		return data;
	};

	Base.prototype.getDataForApi = function (object) {

		if (object == null) {
			object = this;
		}

		delete object.errors;

		return JSON.parse(JSON.stringify(object));
	};

	/*
	Callbacks for $http response promise
	 */

	Base.prototype.successCallback = function (data, status, headers, config) {
		// console.log(data, 'successCallback');
		return this.assignProperties((data.data != undefined) ? data.data : data);
	};

	Base.prototype.failureCallback = function (data, status, headers, config) {
		return this.assignErrors(data.error || data);
	};

	Base.prototype.assignErrors = function (errorData) {
		return this.errors = errorData;
	};

	Base.prototype.insert = function () {
		var d = $q.defer();
		var _this = this;
		$http.post('/api/auth', _this)
		.success(function (result) {
			_this.assignProperties(result.data);
			d.resolve(_this);
		})
		.error(function (error) {
			d.reject(error);
		});
		return d.promise;
	};

	Base.prototype.update = function () {
		var d = $q.defer();
		var _this = this;
		$http.put('/api/auth/' + _this.id, _this)
		.success(function (result) {
			_this.assignProperties(result.data);
			d.resolve(_this);
		})
		.error(function (error) {
			d.reject(error);
		});
		return d.promise;
	};

	Base.prototype.save = function () {
		var d = $q.defer();
		var _this = this;
		var promise = (_this.id != null && _this.id != undefined && _this.id != 0) ? _this.update() : _this.insert();
		promise
		.then(function (result) {
			d.resolve(_this);
		},
			function (error) {
			d.reject(error);
		});
		return d.promise;
	};

	function convertToDate(object) {

		var key;
		var dateRegex = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

		for (key in object) {

			//Si es un arreglo, para cada elemento, recursivamente actualizar sus propiedades
			if (Array.isArray(object[key])) {
				for (var i in object[key]) {
					object[key][i] = convertToDate(object[key][i])
				}
				//Si es un objeto recursivamente actualizar sus propiedades
			}
			if (typeof object[key] == "object") {
				object[key] = convertToDate(object[key])
			} else if (typeof object[key] == "string") {
				if (/date|fecha/.test(key.toLowerCase()) || dateRegex.test(object[key])) {
					object[key] = new Date(object[key]);

					if (isNaN(object[key])) {
						object[key] = undefined;
					}
				}
			}
		}
		return object;
	};
	return Base;
});
