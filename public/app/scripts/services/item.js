﻿'use strict';

angular.module('MobileCRMApp')
.factory('Item', function (Base, $location) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Item;	

	function Item(propValues) {
		Item.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/item";
		this.price = this.price || 0;
		this.quantity = this.quantity || 1;
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
	extend(Item, Base);

	// Funcion que retorna las propiedades de una cuenta
	Item.properties = function () {
		var at = {};
		return at;
	};
	Item.prototype.getTotalPriceDelivery = function (quantitymiles) {
		var total = 0;

		if (this._id == 789) {
			var InitPrice = this.price;
			var qtity = 0;

			if (quantitymiles) {
				qtity = quantitymiles;
			} else {
				qtity = this.quantity;
			}

			if (qtity <= 30) {
				total += InitPrice
			} else {
				var minMiles = 30;
				var miles = qtity;
				var miles30 = 0;

				total += (miles - minMiles) * 3.25 + (InitPrice)
			}
			return total;
		} else if (this._id == 761) {
			if (this.quantity == 0) { return 0 }
			return this.price * (this.quantity || 1);
		} else {
			return this.price * (this.quantity || 1);
		}
	};

	Item.prototype.getTotalPrice = function(){
		return this.price * (this.quantity || 1);
	};

	Item.prototype.goTo = function () {
		$location.path('/item/' + this._id);
	};
	return Item;

});
