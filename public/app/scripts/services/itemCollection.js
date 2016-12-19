'use strict';

angular.module('MobileCRMApp')
.factory('ItemCollection', function (Base, $location) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var ItemCollection;

	function ItemCollection(propValues) {
		ItemCollection.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/itemCollection";
		this.description = this.description || '';
		this.clientId = this.clientId || null;
		this.items = this.items || [];
		this.itemsQuantity = this.itemsQuantity || {};
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
	extend(ItemCollection, Base);

	// Funcion que retorna las propiedades de una cuenta
	ItemCollection.properties = function () {
		var at = {};
		return at;
	};

	ItemCollection.prototype.goTo = function () {
		$location.path('/itemCollection/' + this._id);
	};

	return ItemCollection;
});
