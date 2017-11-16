'use strict';

angular.module('MobileCRMApp')
.factory('Invoice', function (Base, Item, $rootScope, $location, $q,$http, toaster, dialogs, Loading, ServiceOrder, WorkOrder) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Invoice;
	var a;
	function Invoice(propValues) {
		a = document.createElement("a");
			document.body.appendChild(a);
		Invoice.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/invoice";
		this.client = this.client || {};
		this.invoiceNumber = this.invoiceNumber || '';
		this.pono = this.pono || '';
		this.unitno = this.unitno || '';
		this.isono = this.isono || '';
		this.siteAddress = this.siteAddress || {};
		this.phone = this.phone || {};
		this.comment = this.comment || '';
		this.status = this.status || { _id: 1, description: 'Pending' };
		this.total = this.total || '';
		this.items = this.items || [];
		this.date = this.date || new Date();

		this.dueDate = new Date(this.date);
		this.dueDate.setDate(this.dueDate.getDate()+30);
		
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
	extend(Invoice, Base);

	// Funcion que retorna las propiedades de una cuenta
	Invoice.properties = function () {
		var at = {};
		return at;
	};
	
	Invoice.prototype.getTotal = function(){
		var total = 0;
		for(var i = 0; i < this.items.length; i++){
			total += this.items[i].getTotalPrice();
		}
		this.total = total;
		return total;
	};


	Invoice.prototype.getTaxes = function(){
		var total = 0;
		var taxes = 0;
		if (this.dor) {
			if (this.client && this.client.company) {
				taxes = this.client.company.taxes || 0;
			}
			return this.total * taxes;
		} else {
			for (var i = 0; i < this.items.length; i++) {
				total += this.items[i].getTotalPrice();
			}
			
			if (this.client && this.client.company) {
				taxes = this.client.company.taxes || 0;
			}
			return total * taxes;
		}	
	};
	
	Invoice.prototype.goTo = function () {
		$location.path('/invoice/' + this._id);
	};

	Invoice.prototype.callInvoice = function (statusList, companyList) {
		var d = $q.defer();
		var _this = this;

		var invoice = new Invoice().findById(parseInt(this._id))
			.then(function(result){

				var dialog = dialogs.create('views/invoiceModal.html', 'InvoiceModalCtrl',
				 {
								data: this,
								status : statusList,
								companies : companyList,
								invoice :result
				});
				dialog.result
					.then(function(result){
						// return result;
						d.resolve(result)
					})

			});

			return d.promise;
	}

	Invoice.prototype.download = function(){
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
	Invoice.prototype.send = function(emails){
		var d = $q.defer();
		var _this = this;
		var email = _this.client ? _this.client.account.email : null;

		var dialog = dialogs.create('views/emails.html', 'EmailsCtrl', { email: email });
		dialog.result.then(function (emails) {
			toaster.warning('Sending the email');
			$http.post(_this.baseApiPath + '/send', { id: _this._id, emails: emails })
			.success(function (data) {
				toaster.success('The invoice has been sent!.');
		    })
		    .error(function (data, status, headers, config) {
		    	toaster.error('There was an error sending the email, please try again')
		        d.reject(data);
		    });
		});
		return d.promise;
	};
	Invoice.prototype.sendTo = function(emails, sendToAllAdmin){
		var d = $q.defer();
		var _this = this;
		toaster.warning('Sending the email');
		$http.post(_this.baseApiPath + '/send', { id: _this._id, emails: emails, sendToAllAdmin: sendToAllAdmin })
		.success(function (data) {
			toaster.success('The invoice has been sent!.');
			$location.path('invoiceList');
	    })
	    .error(function (data, status, headers, config) {
	    	toaster.error('There was an error sending the email, please try again')
	        d.reject(data);
	    });
		return d.promise;
	};
	Invoice.prototype.sendDelete = function(emails, invoice){
		var d = $q.defer();
		var _this = this;
		toaster.warning('Sending the email');
		$http.post(_this.baseApiPath + '/sendDelete', { id: _this._id, emails: emails, invoice: invoice })
		.success(function (data) {
			toaster.success('The invoice has been sent!.');
			$location.path('invoiceList');
	    })
	    .error(function (data, status, headers, config) {
	    	toaster.error('There was an error sending the email, please try again')
	        d.reject(data);
	    });
		return d.promise;
	};
	Invoice.prototype.getMonthlyStatement = function(query){
		var d = $q.defer();
		var _this = this;
		$http.post(_this.baseApiPath + '/monthlyStatement', { query: query })
		.success(function (data) {
			for(var i = 0; i < data.length; i++){
				for(var j = 0; j < data[i].invoices.length; j++){
					data[i].invoices[j].itemType = data[i].invoices[j].sor ? "ServiceOrder" : "WorkOrder";
					if(data[i].invoices[j].itemType == 'ServiceOrder'){
						data[i].invoices[j] = new Invoice(angular.copy(data[i].invoices[j]));
					}
					else if(data[i].invoices[j].itemType == 'WorkOrder'){
						data[i].invoices[j] = new Invoice(angular.copy(data[i].invoices[j]));
					}
				}
			}
			d.resolve(data)
	    })
	    .error(function (data) {
	    	console.log(data);
	    	toaster.error('There was an error, please try again');
	        d.reject(data);
	    });
		return d.promise;
	};

	Invoice.prototype.exportMonthlyStatement = function(query, format){
		var d = $q.defer();
		var _this = this;
		Loading.show();
		$http({
			url: this.baseApiPath + '/monthlyStatement/export',
			method: "POST",
			data: { query: query, format: format },
			headers: {
			'Content-type': 'application/json'
			},
			responseType: 'arraybuffer'
		})
		.success(function (data, status, headers, config) {
			var json = JSON.stringify(data);
			var blob = new Blob([data], {
				type: format == 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});
			var url = window.URL.createObjectURL(blob);
			
			a.href = url;
			a.download = 'monthlyStatement.' + format;
			a.click();
			window.URL.revokeObjectURL(url);
			Loading.hide();
			d.resolve(url);
	    })
	    .error(function (data, status, headers, config) {
	    	Loading.hide();
	    	toaster.error('There was an error exporting the file, please try again')
	        d.reject(data);
	    });
	    return d.promise;
	};
	Invoice.prototype.changeStatus = function(){
		var d = $q.defer();
		var invoice = this;
		$http.post(this.baseApiPath + '/status', { id: this._id })
		.success(function(res){
			
			invoice.status.description = res.description;
			invoice.statusPaid.description = res._id == 3 ? "Pending to Pay" : res.description;

			toaster.success('The status has been changed!.');
			d.resolve(true);
		})
		.error(function(error){
			toaster.error('There was an error changing the status, please try again');
			d.reject(error)
		});
		return d.promise;
	};

	Invoice.prototype.showPicture = function(index){
		var dialog = dialogs.create('views/photo.html', 'PhotoCtrl', { photos: this.photos, index: (index || 0) });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	Invoice.prototype.getExpenses = function(){
		var d = $q.defer();
		var invoice = this;
		$http.get(this.baseApiPath + '/expenses')
		.success(function(res){
			d.resolve(res || []);
		})
		.error(function(error){
			d.reject(error)
		});
		return d.promise;
	};

	Invoice.prototype.getExpensesbyFilter = function(query, start, end){
		var d = $q.defer();
		var invoice = this;

		var _query = {};
	    _query.query = query;

		if (start) { // Si no se envia la fecha de inicio no se toma
	      _query['start'] = new Date(start);//.toISOString();
	    };
	    if (end) { // Si no se envia la fecha fin el no se toma
	      _query['end'] = new Date(end);//.toISOString();
	    };


		$http.post(this.baseApiPath + '/getExpensesByFilter', _query)
		.success(function(res){
			d.resolve(res || []);
		})
		.error(function(error){
			d.reject(error)
		});
		return d.promise;
	};

	Invoice.prototype.getReport = function(query, queryDescription){
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
			console.log(query)

			if (queryDescription.status === 'Completed (Pending to Pay)') {
				queryDescription.status = 'Pending to Pay';
			}

			if (queryDescription.status === 'Completed (Paid)') {
				queryDescription.status = 'Paid';
			}

			var reportName = ((queryDescription.status ? queryDescription.status + ' ' :'') 
							+(queryDescription.pendingPo ? 'without PO ' : '')
							+(queryDescription.po ? 'With PO '  : '')
							+(queryDescription.expenses ? 'Expenses ' :'')
							+ 'REPORT - MOBILE ONE RESTORATION LCC (UPDATED) - '
							+(queryDescription.company ? queryDescription.company + ' ' : '')
							+(queryDescription.branch ? queryDescription.branch  + ' ' : '')).toUpperCase()
							+formatDate(new Date) 
							+'.xlsx';

			a.download = reportName;
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

	function formatDate(date) {

	  var day = date.getDate();
	  var month = date.getMonth();
	  var year = date.getFullYear();

	  return day + "-" + month + "-" + year;
	}

	return Invoice;
});
