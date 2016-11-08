'use strict';

angular.module('MobileCRMApp')
.factory('OrderService', function (Base, Item, $rootScope, $location, $q,$http, toaster, dialogs) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var OrderService;
var a;
	function OrderService(propValues) {
		a = document.createElement("a");
			document.body.appendChild(a);
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
		this.status = this.status || { _id: 1, description: 'Pending' };
		this.total = this.total || '';
		this.items = this.items || [];
		for(var i = 0; i < this.items.length; i++){
			this.items[i] = new Item(this.items[i]);
		}
		if($rootScope.userData.role._id != 1){
			this.invoiceNumber = 'Pending Invoice';
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

	OrderService.prototype.getInvoice = function(){
		var d = $q.defer();
		var _this = this;
		$http({
			url: this.baseApiPath + '/invoice',
			method: "POST",
			data: { id: _this._id }, //this is your json data string
			headers: {
			'Content-type': 'application/json'
			},
			responseType: 'arraybuffer'
		})
		.success(function (data, status, headers, config) {
			var json = JSON.stringify(data);
			var blob = new Blob([data], {
				type: "application/pdf"
			});
			var url = window.URL.createObjectURL(blob);
			
			a.href = url;
			a.download = _this.invoiceNumber + '.pdf';
			a.click();
			window.URL.revokeObjectURL(url);
			d.resolve(url);
	    })
	    .error(function (data, status, headers, config) {
	    	toaster.error('There was an error exporting the file, please try again')
	        d.reject(data);
	    });
	    return d.promise;
	};
	OrderService.prototype.sendInvoice = function(){
		var d = $q.defer();
		$http.post(this.baseApiPath + '/send', { id: this._id })
		.success(function (data) {
			toaster.success('The Service Order has been sent!.');
	    })
	    .error(function (data, status, headers, config) {
	    	toaster.error('There was an error sending the file, please try again')
	        d.reject(data);
	    });
		return d.promise;
	};

	OrderService.prototype.showPicture = function(index){
		console.log(this.photos.length)
		var dialog = dialogs.create('views/photo.html', 'PhotoCtrl', { photos: this.photos, index: (index || 0) });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};
	return OrderService;
});
