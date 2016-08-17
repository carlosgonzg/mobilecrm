'use strict';

angular.module('MobileCRMApp')
.factory('Role', function (Base, $http, $q, $window, $rootScope, $location, toaster) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Role;

	function Role(propValues) {
		Role.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/role";
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
	extend(Role, Base);

	// Funcion que retorna las propiedades de una cuenta
	Role.properties = function () {
		var at = {};
		return at;
	};
	return Role;

});
