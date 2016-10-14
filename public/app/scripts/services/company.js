'use strict';

angular.module('MobileCRMApp')
.factory('Company', function (Base, $http, $q, $window, $rootScope, $location, toaster) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Company;

	function Company(propValues) {
		Company.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/company";
		this.entity = this.entity || { name: '' };
		this.addresses = this.addresses || [];
		this.phones = this.phones || [];
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
	extend(Company, Base);

	// Funcion que retorna las propiedades de una cuenta
	Company.properties = function () {
		var at = {};
		return at;
	};
	Company.prototype.goTo = function () {
		$location.path('/company/' + this._id);
	};
	return Company;

});
