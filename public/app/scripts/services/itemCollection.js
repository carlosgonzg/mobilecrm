'use strict';

angular.module('MobileCRMApp')
.factory('ItemCollection', function (Base, $location, $q, Item) {

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
		this.total = this.total || 0;
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

	ItemCollection.prototype.setTotal = function(items){
		var _this = this;
		items = items || [];
		var promise = $q.when({ data: items });
		if(items.length <= 0){
			promise = _this.filter({ });
		}
		promise.then(function(result){
			_this.total = _.reduce(_this.items, function(memo, data){
				var item = _.filter(result.data, function(obj){ return obj._id == data; })[0] || { price: 0 };
				return memo + item.price * (_this.itemsQuantity[data] || 1);
			}, 0);
		});
	};

	ItemCollection.prototype.goTo = function () {
		$location.path('/itemCollection/' + this._id);
	};

	return ItemCollection;
});
