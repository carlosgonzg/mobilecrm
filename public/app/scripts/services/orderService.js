'use strict';

angular.module('MobileCRMApp')
.factory('OrderService', function (Base, Item, $rootScope) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var OrderService;

	function OrderService(propValues) {
		OrderService.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/OrderService";
		this.client = this.client || {};
		this.invoiceNumber = this.invoiceNumber || '';
		this.sor = this.sor || '';
		this.pono = this.pono || '';
		this.unitno = this.unitno || '';
		this.isono = this.isono || '';
		this.siteAddress = this.siteAddress || {};
		this.phone = this.phone || {};
		this.comment = this.comment || '';
		this.status = this.status || '';
		this.total = this.total || '';
		this.items = this.items || [];
		for(var i = 0; i < this.items.length; i++){
			this.items[i] = new Item(this.items[i]);
		}
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
	extend(OrderService, Base);

	// Funcion que retorna las propiedades de una cuenta
	OrderService.properties = function () {
		var at = {};
		return at;
	};
	
	OrderService.prototype.getTotal = function(){
		var total = 0;
		for(var i = 0; i < this.items.length; i++){
			total += this.items[i].getTotalPrice();
		}
		this.total = total;
		return total;
	};
	
	
	OrderService.prototype.goTo = function () {
		$location.path('/orderService/' + this._id);
	};
	
	return OrderService;

});
