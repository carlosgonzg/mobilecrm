'use strict';

angular.module('MobileCRMApp')
.factory('SetupTearDown', function (Base, Item, $rootScope, $location, $q,$http, toaster, dialogs) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var SetupTearDown;
var a;
	function SetupTearDown(propValues) {
		a = document.createElement("a");
			document.body.appendChild(a);
		SetupTearDown.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/SetupTearDown";
		this.client = this.client || {};
		this.invoiceNumber = this.invoiceNumber || 'Pending Invoice';
		this.tor = this.tor || '';
		this.pono = this.pono || '';
		this.unitno = this.unitno || '';
		this.isono = this.isono || '';
		this.siteAddress = this.siteAddress || {};
		this.phone = this.phone || {};
		this.comment = this.comment || '';
		this.status = this.status || { _id: 1, description: 'Pending' };
		this.total = this.total || '';
		this.items = this.items || [];
		this.contacts = this.contacts || [{}, {}, {}];
		this.typeItem = this.typeItem || {};
		this.fromQuotes = this.fromQuotes || 0 
		
		for(var i = 0; i < this.items.length; i++){
			this.items[i] = new Item(this.items[i]);
		}
// 		if($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5){
// 			this.invoiceNumber = 'Pending Invoice';
// 		}
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
	extend(SetupTearDown, Base);

	// Funcion que retorna las propiedades de una cuenta
	SetupTearDown.properties = function () {
		var at = {};
		return at;
	};
	
	SetupTearDown.prototype.getTotal = function(){
		var total = 0;
		for(var i = 0; i < this.items.length; i++){
			total += this.items[i].getTotalPrice();
		}
		this.total = total;
		return total;
	};
	
	
	SetupTearDown.prototype.goTo = function () {
		$location.path('/SetupTearDown/' + this._id);
	};

	SetupTearDown.prototype.download = function(){
		var d = $q.defer();
		var _this = this;
		toaster.warning('Generating the document');
		$http({
			url: this.baseApiPath + '/download',
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
			a.download = _this.tor + '.pdf';
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
	SetupTearDown.prototype.getReport = function(query, queryDescription){
		var d = $q.defer();
		var _this = this;
		$http({
			url: this.baseApiPath + '/report',
			method: "POST",
			data: { query: query, queryDescription: queryDescription },
			headers: {
			'Content-type': 'application/json'
			},
			responseType: 'arraybuffer'
		})
		.success(function (data, status, headers, config) {
			var json = JSON.stringify(data);
			var blob = new Blob([data], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			});
			var url = window.URL.createObjectURL(blob);
			
			a.href = url;

			a.download = 'Set Up & Tear Down Report '+formatDate(new Date()) + '.xlsx';
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
	SetupTearDown.prototype.send = function(){
		var d = $q.defer();
		toaster.warning('Sending the email');
		console.log(65487)
		$http.post(this.baseApiPath + '/send', { id: this._id })
		.success(function (data) {
			toaster.success('The Set Up & Tear Down has been sent!.');
	    })
	    .error(function (data, status, headers, config) {
	    	toaster.error('There was an error sending the file, please try again')
	        d.reject(data);
	    });
		return d.promise;
	};

	SetupTearDown.prototype.sendDelete = function(SetupTearDown){
		var d = $q.defer();
		toaster.warning('Sending the email');
		console.log(this.baseApiPath)
		$http.post(this.baseApiPath + '/Delete', { id: this._id, SetupTearDown: SetupTearDown })
		.success(function (data) {
			toaster.success('The Set Up & Tear Down has been sent!.');
	    })
	    .error(function (data, status, headers, config) {
	    	toaster.error('There was an error sending the file, please try again')
	        d.reject(data);
	    });
		return d.promise;
	};

	SetupTearDown.prototype.showPicture = function(index){
		var dialog = dialogs.create('views/photo.html', 'PhotoCtrl', { photos: this.photos, index: (index || 0) });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	SetupTearDown.prototype.filter = function(query, sort){
		var deferred = $q.defer();
		var _this = this.constructor;
		$http.post(this.baseApiPath + '/filter', { query: query, sort: sort })
		.success(function (data, status, headers, config) {
			var response = {},
			data = data.data;
			//Create a new object of the current class (or an array of them) and return it (or them)
			if (Array.isArray(data)) {
				response.data = data.map(function (obj) {
						return new _this(obj);
					});
				//Add "delete" method to results object to quickly delete objects and remove them from the results array
				response.delete  = function (object) {
					object.delete ().then(function () {
						return response.data.splice(response.data.indexOf(object), 1);
					});
				};
			} else {
				response = new _this(data);
			}
			return deferred.resolve(response);
		}).error(function (data, status, headers, config) {
			return deferred.reject(data);
		});
		return deferred.promise;
	};

	SetupTearDown.prototype.changeStatus = function(){
		var d = $q.defer();
		$http.post(this.baseApiPath + '/status', { id: this._id })
		.success(function(res){
			toaster.success('The status has been changed!.');
			d.resolve(true);
		})
		.error(function(error){
			toaster.error('There was an error changing the status, please try again');
			d.reject(error)
		});
		return d.promise;
	};

	SetupTearDown.prototype.getTaxes = function(){
		var total = 0;
		var taxes = 0;
		if (this.dor) {
			if (this.client && this.client.company) {
				taxes = this.client.company.taxes || 0;
			}
			if (this.client && this.client.branch) {
				taxes = this.client.branch.taxes || taxes;
			}
			return this.total * taxes;
		} else {
			for (var i = 0; i < this.items.length; i++) {
				total += this.items[i].getTotalPrice();
			}
			
			if (this.client && this.client.company) {
				taxes = this.client.company.taxes || 0;
			}
			if (this.client && this.client.branch) {
				taxes = this.client.branch.taxes || taxes;
			}
			return total * taxes;
		}	
	};

	SetupTearDown.prototype.getTotal = function(){
		var total = 0;
		for(var i = 0; i < this.items.length; i++){
			total += this.items[i].getTotalPrice();
		}
		this.total = total;
		return total;
	};


	function formatDate(date) {

	  var day = date.getDate();
	  var month = date.getMonth();
	  var year = date.getFullYear();

	  return day + "-" + month + "-" + year;
	}

	return SetupTearDown;
});
