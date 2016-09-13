'use strict';

angular.module('MobileCRMApp')
.factory('WorkOrder', function (Base, Item, $rootScope, $location) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var WorkOrder;

	function WorkOrder(propValues) {
		WorkOrder.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/WorkOrder";
		this.client = this.client || {};
		this.invoiceNumber = this.invoiceNumber || '';
		this.siteAddress = this.siteAddress || {};
		this.phone = this.phone || {};
		this.comment = this.comment || '';
		this.status = this.status || { _id: 1, description: 'Pending' };
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
	extend(WorkOrder, Base);

	// Funcion que retorna las propiedades de una cuenta
	WorkOrder.properties = function () {
		var at = {};
		return at;
	};
	
	WorkOrder.prototype.getTotal = function(){
		var total = 0;
		for(var i = 0; i < this.items.length; i++){
			total += this.items[i].getTotalPrice();
		}
		this.total = total;
		return total;
	};
	
	
	WorkOrder.prototype.goTo = function () {
		$location.path('/workOrder/' + this._id);
	};
	
	return WorkOrder;

});
