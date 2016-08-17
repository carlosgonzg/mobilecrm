'use strict';

angular.module('MobileCRMApp')
.factory('Country', function (Base, $http, $q, $window, $rootScope, $location, toaster, Province) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Country;

	function Country(propValues) {
		Country.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/country";
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
	extend(Country, Base);

	// Funcion que retorna las propiedades de una cuenta
	Country.properties = function () {
		var at = {};
		return at;
	};

	Country.prototype.getProvinces = function () {
		var d = $q.defer();
		var _this = this;
		$http.get(_this.baseApiPath + '/getprovinces?id=' + _this.id)
		.success(function (result) {
			var provinces = [];
			for (var i = 0; i < result.data.length; i++) {
				var province = new Province(result.data[i]);
				provinces.push(province);
			}
			d.resolve(provinces);
		})
		.error(function (error) {
			d.reject(error);
		});
		return d.promise;
	};
	return Country;

});
