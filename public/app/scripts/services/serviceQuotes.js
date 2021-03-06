'use strict';

angular.module('MobileCRMApp')
	.factory('ServiceQuotes', function (Base, Item, $rootScope, $location, $q, $http, toaster, dialogs) {

		// Variable que se utiliza para comprobar si un objeto tiene una propiedad
		// var hasProp = Object.prototype.hasOwnProperty;

		// Nombre de la clase
		var ServiceQuotes;
		var a;
		function ServiceQuotes(propValues) {
			a = document.createElement("a");
			document.body.appendChild(a);
			ServiceQuotes.super.constructor.apply(this, arguments);
			this.baseApiPath = "/api/ServiceQuotes";
			this.client = this.client || {};
			this.invoiceNumber = this.invoiceNumber || 'Pending Invoice';
			this.pono = this.pono || '';
			this.unitno = this.unitno || '';
			this.isono = this.isono || '';
			this.siteAddress = this.siteAddress || { address1: "", address2: "", city: {}, state: {}, country: {} };
			this.phone = this.phone || {};
			this.comment = this.comment || '';
			this.status = this.status || { _id: 1, description: 'Pending' };
			this.total = this.total || '';
			this.items = this.items || [];
			this.contacts = this.contacts || [{}, {}, {}];
			this.serviceType = this.serviceType || { _id: 2, description: 'Work Order' };
			this.approved = this.approved || 1;
			this.quotes = this.quotes || 1;
			this.quotesStatus = this.quotesStatus || 'Pending for Approval'
			this.sor = this.sor || 'Pending Service Order #'
			this.wor = this.wor || 'Pending Work Order #'
			this.tor = this.tor || 'Pending Set Up #'
			this.hor = this.hor || 'Pending Home & Business #'
			this.typeItem = this.typeItem || { item: 'Set Up' };
			this.ACType = this.ACType || { item: 'Bard' };

			for (var i = 0; i < this.items.length; i++) {
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
		extend(ServiceQuotes, Base);

		// Funcion que retorna las propiedades de una cuenta
		ServiceQuotes.properties = function () {
			var at = {};
			return at;
		};

		ServiceQuotes.prototype.getTotal = function (servicesMiles) {
			var total = 0;
			for (var i = 0; i < this.items.length; i++) {
				if (this.items[i]._id == 253) {
					if (servicesMiles) {
						this.items[i].quantity = servicesMiles
					}
					total += (this.items[i].quantity * this.items[i].price)
				} else {
					total += this.items[i].getTotalPrice();
				}
			}
			this.total = total;
			return total;
		};

		ServiceQuotes.prototype.goTo = function () {
			$location.path('/serviceQuotes/' + this._id);
		};

		ServiceQuotes.prototype.getReport = function (query, queryDescription) {
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

					a.download = 'Service Order Report ' + formatDate(new Date()) + '.xlsx';
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

		ServiceQuotes.prototype.send = function () {
			var d = $q.defer();
			var _this = this;
			var email = _this.client ? _this.client.account.email : null;

			var dialog = dialogs.create('views/emails.html', 'EmailsCtrl', { email: email });
			dialog.result.then(function (emails) {
				toaster.warning('Sending the email');
				$http.post(_this.baseApiPath + '/send', { id: _this._id, emails: emails })
					.success(function (data) {
						toaster.success('The Quotes has been sent!.');
					})
					.error(function (data, status, headers, config) {
						toaster.error('There was an error sending the email, please try again')
						d.reject(data);
					});
			});
			return d.promise;
		};

		ServiceQuotes.prototype.sendDelete = function (serviceQuotes) {
			var d = $q.defer();
			toaster.warning('Sending the email');
			$http.post(this.baseApiPath + '/sendDelete', { id: this._id, serviceQuotes: serviceQuotes })
				.success(function (data) {
					toaster.success('The Service Order has been sent!.');
				})
				.error(function (data, status, headers, config) {
					toaster.error('There was an error sending the file, please try again')
					d.reject(data);
				});
			return d.promise;
		};

		ServiceQuotes.prototype.showPicture = function (index) {
			var dialog = dialogs.create('views/photo.html', 'PhotoCtrl', { photos: this.photos, index: (index || 0) });
			dialog.result
				.then(function (res) {
				}, function (res) { });
		};

		ServiceQuotes.prototype.filter = function (query, sort) {
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
						response.delete = function (object) {
							object.delete().then(function () {
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

		ServiceQuotes.prototype.changeStatus = function () {
			var d = $q.defer();
			$http.post(this.baseApiPath + '/status', { id: this._id })
				.success(function (res) {
					toaster.success('The status has been changed!.');
					d.resolve(true);
				})
				.error(function (error) {
					toaster.error('There was an error changing the status, please try again');
					d.reject(error)
				});
			return d.promise;
		};

		function formatDate(date) {
			var day = date.getDate();
			var month = date.getMonth();
			var year = date.getFullYear();

			return day + "-" + month + "-" + year;
		}

		ServiceQuotes.prototype.getTaxes = function (taxes) {
			var total = 0;
			for (var i = 0; i < this.items.length; i++) {
				total += (this.items[i].price * this.items[i].quantity)
			}
			return (total * taxes)
		};

		return ServiceQuotes;
	});
