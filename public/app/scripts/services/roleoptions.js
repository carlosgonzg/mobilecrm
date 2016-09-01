'use strict';

angular.module('MobileCRMApp')
.factory('RoleOptions', function (Base, $http) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var RoleOptions;

	function RoleOptions(propValues) {
		RoleOptions.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/roleOptions";
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
	extend(RoleOptions, Base);

	// Funcion que retorna las propiedades de una cuenta
	RoleOptions.properties = function () {
		var at = {};
		return at;
	};

	return RoleOptions;

});
