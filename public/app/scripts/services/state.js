'use strict';

angular.module('MobileCRMApp')
.factory('State', function (Base, $http, $q, $window, $rootScope, $location, toaster, City) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var State;

	function State(propValues) {
		State.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/State";
	}
	var extend = function (child, parent) {
		var key;
		for (key in parent) {
			if (hasProp.call(parent, key)) {
				child[key] = parent[key];
			}
		}

		function Ctor() {
			this.constructor = child;
		}
		Ctor.prototype = parent.prototype;
		child.prototype = new Ctor();
		child.super = parent.prototype;
		return child;
	};
	// Extender de la clase Base
	extend(State, Base);

	// Funcion que retorna las propiedades de una cuenta
	State.properties = function () {
		var at = {};
		return at;
	};

	State.prototype.getCities = function () {
		var d = $q.defer();
		var _this = this;
		$http.get(_this.baseApiPath + '/getcities?id=' + _this.id)
		.success(function (result) {
			/*
			var cities = [];
			console.log(result)
			for (var i = 0; i < result.data.length; i++) {
			var city = new City(result.data[i]);
			cities.push(cities);
			}*/
			d.resolve(result.data);
		})
		.error(function (error) {
			d.reject(error);
		});
		return d.promise;
	};
	return State;

});
