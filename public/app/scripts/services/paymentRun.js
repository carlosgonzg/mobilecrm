'use strict';

angular.module('MobileCRMApp')
	.factory('paymentRun', function (Base, $http, $q, $window, $rootScope, $location, dialogs, toaster) {

		// Variable que se utiliza para comprobar si un objeto tiene una propiedad
		// var hasProp = Object.prototype.hasOwnProperty;

		// Nombre de la clase
		var paymentRun;
		var a;
		function paymentRun(propValues) {
			a = document.createElement("a");
			document.body.appendChild(a);
			paymentRun.super.constructor.apply(this, arguments);
			this.baseApiPath = "/api/ServiceOrder";
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
			this.contacts = this.contacts || [{}, {}, {}];
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
		extend(paymentRun, Base);

		// Funcion que retorna las propiedades de una cuenta
		paymentRun.properties = function () {
			var at = {};
			return at;
		};

		paymentRun.prototype.goTo = function () {
			$location.path('/paymentRun/' + this._id);
		};

		paymentRun.prototype.filter = function (query, sort) {
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

		return paymentRun;
	});
