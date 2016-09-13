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
	
	Base.prototype.filter = function (query) {
		var deferred = $q.defer();
		var _this = this.constructor;
		$http.post(this.baseApiPath + '/filter', query).success(function (data, status, headers, config) {
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
		$http.get(this.baseApiPath + '/' + id).success(function (data, status, headers, config) {
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
			return deferred.resolve(response.data[0]);
		}).error(function (data, status, headers, config) {
			return deferred.reject(data);
		});
		return deferred.promise;
	};
	
	var validate = function () {
		return true;
	};

	Base.prototype.validate = validate;


	// Paginated Search: Find documents filtered, sorted, limited and skiped by params.
	Base.prototype.paginatedSearch = function (params) {
		var deferred = $q.defer(),
		_this = this.constructor;

		// console.log("\n\n PaginatedSearch: ", params);
		if (params) {
			// console.log('----- Aqui ----');
			$http.post(this.baseApiPath + '/paginated', params).success(function (data, status, headers, config) {
				var response = {},
				data = data.data;
				// Create a new object of the current class (or an array of them) and return it (or them)
				if (Array.isArray(data)) {
					response.data = data.map(function (obj) {
							return new _this(obj);
						});
					// Add "delete" method to results object to quickly delete objects and remove them from the results array
					response.delete  = function (object) {
						object.delete ().then(function () {
							response.data.splice(response.data.indexOf(object), 1);
						});
					};
				} else {
					response = new _this(data);
				}
				return deferred.resolve(response);
			}).error(function (data, status, headers, config) {
				return deferred.reject(data);
			});
		} else {
			deferred.reject({
				res : 'Not ok',
				message : 'Debe introducir los parametros para esta funcion!',
				data : {}
			});
		}
		return deferred.promise;
	};

	// Paginated Search: Find documents filtered, sorted, limited and skiped by params.
	Base.prototype.paginatedCount = function (params) {
		var deferred = $q.defer(),
		_this = this.constructor;

		if (params) {
			$http.post(this.baseApiPath + '/paginated/count', params).success(function (data, status, headers, config) {
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
							response.data.splice(response.data.indexOf(object), 1);
						});
					};
				} else {
					if (typeof data == 'number') {
						data = {
							count : data
						};
					}
					response = new _this(data);
				}
				return deferred.resolve(response);
			}).error(function (data, status, headers, config) {
				return deferred.reject(data);
			});
		} else {
			deferred.reject({
				res : 'Not ok',
				message : 'Debe introducir los parametros para esta funcion!',
				data : {}
			});
		}
		return deferred.promise;
	};

	/*
	Persist the current object's data by passing it to a REST API
	Dynamically switch between POST and PUT verbs if the current object has a populated _id property
	 */
	Base.prototype.save = function (data) {
		var promise,
		_this = this,
		deferred = $q.defer();
		if (data == null || data == undefined) {
			delete this.errors;
			data = this.getDataForApi();
		}

		delete data.baseApiPath;
		if (_this.validate ? _this.validate() : validate()) {
			var url = "" + this.baseApiPath;

			if (_this._id != null && _this._id != undefined)
				url = _this.baseApiPath;
			if (_this.createdBy != undefined) {
				promise = $http.put(url, {
						obj : data,
						query: {
							_id: data._id
						}
					});
			} else {
				promise = $http.post(_this.baseApiPath, {
						obj : data
					});
			}
			promise.success(function (data, status, headers, config) {
				return deferred.resolve(_this.successCallback(data, status, headers, config));
			}).error(function (data, status, headers, config) {
				return deferred.reject(_this.failureCallback(data, status, headers, config));
			});
		} else {
			deferred.reject(new Error('Invalid Object'));
		}
		return deferred.promise;
	};

	// Funcion para actualizar
	Base.prototype.update = function (data) {
		var promise,
		_this = this,
		deferred = $q.defer(); ;

		if (data == null || data == undefined) {
			data = this.getDataForApi();
		}
		if (_this.validate ? _this.validate() : validate()) {
			if (_this._id != null && _this._id != undefined) {
				promise = $http.put(_this.baseApiPath, {
						query : {
							_id : _this._id
						},
						obj : data
						//,query: params
					});
				promise.success(function (data, status, headers, config) {
					return deferred.resolve(_this.successCallback(data, status, headers, config));
				}).error(function (data, status, headers, config) {
					return deferred.reject(_this.failureCallback(data, status, headers, config));
				});
			} else {
				deferred.reject(new Error('Invalid Object'));
			}
		} else {
			deferred.reject(new Error('Invalid Object'));
		}
		return deferred.promise;
	};

	Base.prototype.remove = function (params) {
		var _this = this;
		if (params == null) {
			params = {};
		}
		var deferred = $q.defer();

		var url = this.baseApiPath;
		if (_this._id)
			url = _this.baseApiPath + "/" + this._id;

		$http.delete (url, {
			query : params
		})
		.success(function (data, status, headers, config) {
			return deferred.resolve(_this.successCallback(data, status, headers, config));
		}).error(function (data, status, headers, config) {
			return deferred.reject(_this.failureCallback(data, status, headers, config));
		});

		return deferred.promise;
	};

	Base.prototype.count = function (params) {
		var deferred = $q.defer();
		var _this = this;
		params = params == null ? {}

		 : params;

		$http.post("" + this.baseApiPath + "/count", params).success(function (data, status, headers, config) {
			return deferred.resolve(_this.successCallback(data, status, headers, config));
		})
		.error(function (data, status, headers, config) {
			return deferred.reject(_this.failureCallback(data, status, headers, config));
		});

		return deferred.promise;
	};

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

	Base.prototype.refresh = function () {
		if (this._id == undefined)
			throw new Error('Refresh needs the id of the object');
		var _this = this,
		deferred = $q.defer();
		//    console.log('refresh')
		//    console.log('refresh')

		this.searchById(this._id)
		.then(function (data) {
			deferred.resolve(_this.assignProperties(hiddenProperties.data));
			delete hiddenProperties.data;
		})
		.catch (deferred.reject);

		return deferred.promise;
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
