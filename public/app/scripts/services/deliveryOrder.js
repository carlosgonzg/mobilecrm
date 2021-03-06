'use strict';

angular.module('MobileCRMApp')
	.factory('DeliveryOrder', function (Base, Item, $rootScope, $location, $q, $http, toaster, dialogs) {

		// Variable que se utiliza para comprobar si un objeto tiene una propiedad
		// var hasProp = Object.prototype.hasOwnProperty;

		// Nombre de la clase
		var DeliveryOrder;
		var a;
		function DeliveryOrder(propValues) {
			a = document.createElement("a");
			document.body.appendChild(a);
			DeliveryOrder.super.constructor.apply(this, arguments);
			this.baseApiPath = "/api/deliveryOrder";
			this.client = this.client || {};
			this.invoiceNumber = this.invoiceNumber || 'Pending Invoice';
			this.dor = this.dor;
			this.unitno = this.unitno || '';
			this.siteAddress = this.siteAddress || {};
			this.phone = this.phone || {};
			this.comment = this.comment || '';
			this.status = this.status || { _id: 1, description: 'Waiting for Availability' };
			this.typeTruck = this.typeTruck || {};
			this.driver = this.driver || {};
			this.total = this.total || '';
			this.items = this.items || [];
			this.contacts = this.contacts || [{}, {}, {}];
			this.additionalRoute = this.additionalRoute || {};
			this.RouteMile = this.RouteMile || 0;
			this.ServiceType = this.ServiceType || {};

// 			if ($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5) {
// 				this.invoiceNumber = 'Pending Invoice';
// 			}

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
		extend(DeliveryOrder, Base);

		// Funcion que retorna las propiedades de una cuenta
		DeliveryOrder.properties = function () {
			var at = {};
			return at;
		};

		DeliveryOrder.prototype.getTotal = function (quantitymiles, comp) {
			var total = 0;
			var InitPrice = 0
			var initialMile = 30;
			var costPerMile = 3.25;
			var costPerHours = 0;
			var qtity = 0;
			//console.log(quantitymiles, comp)

			if (this.client._id == undefined) {
				return 0
			}
			//console.log(quantitymiles)

			for (var index = 0; index < this.items.length; index++) {
				InitPrice = this.items[index].price;
				
				if (comp == undefined) {
					//console.log(22222)
					var miles = (this.items[index].quantity || 1);;
	
					if (this.items[index]._id == 805) {
						if (miles > 30) {
							total += (miles - initialMile) * costPerMile + (InitPrice)
						} else {
							total += InitPrice
						}
					} else {
						total += this.items[index].price * (this.items[index].quantity || 1);
					}
					total += total;
				}
				if (this.items[index]._id == 806 || this.items[index]._id == 805) {
					if (comp.perHours != undefined) {
						if (comp.perHours == false && comp.initialCost != undefined) {
							InitPrice = comp.initialCost;
							initialMile = comp.initialMile;
							costPerMile = comp.costPerMile;
						} else {
							if (this.typeTruck._id == 1) {
								costPerHours = comp.costPerHours;
							} else {
								costPerHours = comp.smallTruck;
							}
						}
					}
				}	

				if (this.items[index]._id == 805 && costPerHours == 0) {
					if (quantitymiles == 0) {
						total += 0
					} else if (quantitymiles) {
						qtity = quantitymiles;
					} else {
						qtity = this.items[index].quantity;
					}

					if (qtity <= initialMile) {
						total += InitPrice
					} else {
						var minMiles = initialMile;
						var miles = qtity;

						total += (miles - minMiles) * costPerMile + (InitPrice)

						if (this.items[index].price == 0) {
							var RInitPrice = Math.round(InitPrice * 100) / 100
							this.items[index].price = RInitPrice
						}
					}
				} else if (this.items[index]._id == 806 && costPerHours > 0) {
					qtity = this.items[index].quantity;

					total += costPerHours * (qtity || 1);
				} else {
					total += this.items[index].price * (this.items[index].quantity || 1);
				}
			}
			return total;
		};

		DeliveryOrder.prototype.getTotalPriceDelivery = function (quantitymiles, comp, index) {
			var total = 0;
			var InitPrice = this.items[index].price;
			var initialMile = 30;
			var costPerMile = 3.25;
			var costPerHours = 0;
			var qtity = 0;

			if (comp == undefined) {
				var miles = (this.items[index].quantity || 1);;

				if (this.items[index]._id == 805) {
					if (miles > 30) {
						total += (miles - initialMile) * costPerMile + (InitPrice)
					} else {
						return InitPrice
					}
				} else {
					return this.items[index].price * (this.items[index].quantity || 1);
				}
				return total;
			}
			if (this.items[index]._id == 806 || this.items[index]._id == 805) {
				if (comp.perHours != undefined) {
					if (comp.perHours == false && comp.initialCost != undefined) {
						InitPrice = comp.initialCost;
						initialMile = comp.initialMile;
						costPerMile = comp.costPerMile;
					} else {
						if (this.typeTruck._id == 1) {
							costPerHours = comp.costPerHours;
						} else {
							costPerHours = comp.smallTruck;
						}
					}
				}
			}	

			if (this.items[index]._id == 805 && costPerHours == 0) {
				if (quantitymiles == 0) {
					return 0
				} else if (quantitymiles) {
					qtity = quantitymiles;
				} else {
					qtity = this.items[index].quantity;
				}

				if (qtity <= initialMile) {
					total += InitPrice
				} else {
					var minMiles = initialMile;
					var miles = qtity;

					total += (miles - minMiles) * costPerMile + (InitPrice)
				}
				return total;
			} else if (this.items[index]._id == 806 && costPerHours > 0) {
				qtity = this.items[index].quantity;

				return costPerHours * (qtity || 1);
			} else {
				return this.items[index].price * (this.items[index].quantity || 1);
			}
		};

		DeliveryOrder.prototype.goTo = function () {
			$location.path('/DeliveryOrder/' + this._id);
		};

		DeliveryOrder.prototype.download = function () {
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
					a.download = _this.sor + '.pdf';
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
		DeliveryOrder.prototype.getReport = function (query, queryDescription) {
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

					a.download = 'Delivery Order Report ' + formatDate(new Date()) + '.xlsx';
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
		DeliveryOrder.prototype.send = function () {
/* 			var d = $q.defer();
			toaster.warning('Sending the email');
			$http.post(this.baseApiPath + '/send', { id: this._id })
				.success(function (data) {
					toaster.success('The Delivery Order has been sent!.');
				})
				.error(function (data, status, headers, config) {
					toaster.error('There was an error sending the file, please try again')
					d.reject(data);
				});
			return d.promise; */
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

		DeliveryOrder.prototype.showPicture = function (index) {
			var dialog = dialogs.create('views/photo.html', 'PhotoCtrl', { photos: this.photos, index: (index || 0) });
			dialog.result
				.then(function (res) {
				}, function (res) { });
		};

		DeliveryOrder.prototype.filter = function (query, sort) {
			var deferred = $q.defer();
			var _this = this.constructor;

			$http.post(this.baseApiPath + '/filter', { query: query, sort: sort })
				.success(function (data, status, headers, config) {
					console.log(data)	
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

		DeliveryOrder.prototype.changeStatus = function () {
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

		DeliveryOrder.prototype.getTaxes = function(){
			var total = 0;
			var taxes = 0;
			
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
		};

		DeliveryOrder.prototype.getTotalDelivery = function () {
		var total = 0;
		var InitPrice = 0
		var initialMile = 30;
		var costPerMile = 3.25;
		var costPerHours = 0;
		var qtity = 0;

		if (this.client._id == undefined) {
			return 0
		}
		var comp = this.client.company

		for (var index = 0; index < this.items.length; index++) {
			InitPrice = this.items[index].price;

			if (comp == undefined) {
				//console.log(22222)
				var miles = (this.items[index].quantity || 1);;

				if (this.items[index]._id == 805) {
					if (miles > 30) {
						total += (miles - initialMile) * costPerMile + (InitPrice)
					} else {
						total += InitPrice
					}
				} else {
					total += this.items[index].price * (this.items[index].quantity || 1);
				}
				total += total;
			}
			if (this.items[index]._id == 806 || this.items[index]._id == 805) {
				if (comp.perHours != undefined) {
					if (comp.perHours == false && comp.initialCost != undefined) {
						InitPrice = comp.initialCost;
						initialMile = comp.initialMile;
						costPerMile = comp.costPerMile;
					} else {
						if (this.typeTruck._id == 1) {
							costPerHours = comp.costPerHours;
						} else {
							costPerHours = comp.smallTruck;
						}
					}
				}
			}

			if (this.items[index]._id == 805 && costPerHours == 0) {
				qtity = this.items[index].quantity;				

				if (qtity <= initialMile) {
					total += InitPrice
				} else {
					var minMiles = initialMile;
					var miles = qtity;

					total += (miles - minMiles) * costPerMile + (InitPrice)
				}
			} else if (this.items[index]._id == 806 && costPerHours > 0) {
				qtity = this.items[index].quantity;

				total += costPerHours * (qtity || 1);
			} else {
				total += this.items[index].price * (this.items[index].quantity || 1);
			}
		}
		return total;
	};

		DeliveryOrder.prototype.sendDelete = function (deliveryOrder) {
			var d = $q.defer();
			toaster.warning('Sending the email');
			$http.post(this.baseApiPath + '/sendDelete', { id: this._id, deliveryOrder: deliveryOrder })
				.success(function (data) {
					toaster.success('The Delivery Order has been sent!.');
				})
				.error(function (data, status, headers, config) {
					toaster.error('There was an error sending the file, please try again')
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

		return DeliveryOrder;
	});
