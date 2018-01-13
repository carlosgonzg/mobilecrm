'use strict';

angular.module('MobileCRMApp')
	.factory('ItemCompany', function (Base, $location) {

		// Variable que se utiliza para comprobar si un objeto tiene una propiedad
		// var hasProp = Object.prototype.hasOwnProperty;

		// Nombre de la clase
		var ItemCompany;

		function ItemCompany(propValues) {
			ItemCompany.super.constructor.apply(this, arguments);
			this.baseApiPath = "/api/company";
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
		extend(ItemCompany, Base);

		// Funcion que retorna las propiedades de una cuenta
		ItemCompany.properties = function () {
			var at = {};
			return at;
		};

		ItemCompany.prototype.goTo = function () {
			$location.path('/itemCompany/' + this._id);
		};
		return ItemCompany;

	});
