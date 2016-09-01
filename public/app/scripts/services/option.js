'use strict';

angular.module('MobileCRMApp')
.factory('Option', function (Base) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Option;

	function Option(propValues) {
		Option.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/Option";
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
	extend(Option, Base);

	// Funcion que retorna las propiedades de una cuenta
	Option.properties = function () {
		var at = {};
		return at;
	};

	return Option;

});
