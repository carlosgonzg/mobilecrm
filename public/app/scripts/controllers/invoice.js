'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('InvoiceCtrl', function ($scope, $rootScope, $location, toaster, $window, User, invoice, statusList, statusDelivery, Item, ServiceOrder, WorkOrder, DeliveryOrder, dialogs, Invoice, Company, companies, Driver, ServiceQuotes, SetupTearDown) {
		$scope.invoice = invoice;
		$scope.items = [];
		$scope.waiting = false;
		$scope.readOnly = $rootScope.userData.role._id != 1;
		$scope.expenses = []
		$scope.driver = Driver.data || {};
		$scope.statusTech = {};

		if ($rootScope.userData.role._id != 1) {
			$scope.invoice.client = new User($rootScope.userData);
		}
		if ($scope.invoice.dor) {
			$scope.invoice.comment = $scope.invoice.comments
		}
		$scope.listStatus = statusList;
		$scope.listCompany = companies.data;
		$scope.statusDelivery = statusDelivery;
		$scope.Math = $window.Math;

		$scope.wsClassOS = ServiceOrder;
		$scope.wsFieldsOS = [{
			label: 'Service Order #',
			field: 'sor',
			type: 'text',
			show: true
		}, {
			label: 'Invoice #',
			field: 'invoiceNumber',
			type: 'text',
			show: true
		}, {
			label: 'Created Date',
			field: 'createdDate',
			type: 'date',
			show: true
		}, {
			label: 'Completed Date',
			field: 'originalShipDate',
			type: 'date',
			show: true
		}, {
			label: 'Company',
			field: 'client.company.entity.name',
			type: 'text',
			show: true
		}, {
			label: 'Branch',
			field: 'client.branch.name',
			type: 'text',
			show: true
		}, {
			label: 'Customer',
			field: 'client.entity.fullName',
			type: 'text',
			show: true
		}, {
			label: 'Status',
			field: 'status.description',
			type: 'text',
			show: true
		}, {
			label: 'Total Amount',
			field: 'total',
			type: 'currency',
			show: true
		}
		];
		$scope.wsClassWO = WorkOrder;
		$scope.wsFieldsWO = [{
			label: 'Work Order #',
			field: 'wor',
			type: 'text',
			show: true
		}, {
			label: 'Invoice #',
			field: 'invoiceNumber',
			type: 'text',
			show: true
		}, {
			label: 'Created Date',
			field: 'createdDate',
			type: 'date',
			show: true
		}, {
			label: 'Serial #',
			field: 'unitno',
			type: 'text',
			show: true
		}, {
			label: 'Company',
			field: 'client.company.entity.name',
			type: 'text',
			show: true
		}, {
			label: 'Branch',
			field: 'client.branch.name',
			type: 'text',
			show: true
		}, {
			label: 'Customer',
			field: 'client.entity.fullName',
			type: 'text',
			show: true
		}, {
			label: 'Status',
			field: 'status.description',
			type: 'text',
			show: true
		}, {
			label: 'Total Amount',
			field: 'total',
			type: 'currency',
			show: true
		}
		];
		$scope.wsClass = User;
		$scope.wsFields = [{
			field: 'entity.fullName',
			label: 'Name',
			type: 'text',
			show: true
		}, {
			field: 'account.email',
			label: 'Email',
			type: 'text',
			show: true
		}, {
			field: 'company.entity.name',
			label: 'Company',
			type: 'text',
			show: true
		}, {
			field: 'branch.name',
			label: 'Branch',
			type: 'text',
			show: true
		}
		];

		$scope.WsClassDO = DeliveryOrder
		$scope.WsfieldsDO = [{
			label: 'Delivery Order #',
			field: 'dor',
			type: 'text',
			show: true
		}, {
			label: 'Invoice #',
			field: 'invoiceNumber',
			type: 'text',
			show: true
		}, {
			label: 'Date',
			field: 'createdDate',
			type: 'date',
			show: true
		}, {
			label: 'Company',
			field: 'client.company.entity.name',
			type: 'text',
			show: true
		}, {
			label: 'Branch',
			field: 'client.branch.name',
			type: 'text',
			show: true
		}, {
			label: 'Customer',
			field: 'client.entity.fullName',
			type: 'text',
			show: true
		}, {
			label: 'Status',
			field: 'status.description',
			type: 'text',
			show: true
		}, {
			label: 'Total Amount',
			field: 'total',
			type: 'currency',
			show: true
		}
		];

		$scope.WsClassSetup = SetupTearDown
		$scope.WsfieldsSetup = [{
			label: 'Set Up #',
			field: 'tor',
			type: 'text',
			show: true
		}, {
			label: 'Invoice #',
			field: 'invoiceNumber',
			type: 'text',
			show: true
		}, {
			label: 'Date',
			field: 'createdDate',
			type: 'date',
			show: true
		}, {
			label: 'Company',
			field: 'client.company.entity.name',
			type: 'text',
			show: true
		}, {
			label: 'Branch',
			field: 'client.branch.name',
			type: 'text',
			show: true
		}, {
			label: 'Customer',
			field: 'client.entity.fullName',
			type: 'text',
			show: true
		}, {
			label: 'Status',
			field: 'status.description',
			type: 'text',
			show: true
		}, {
			label: 'Total Amount',
			field: 'total',
			type: 'currency',
			show: true
		}
		];

		$scope.filterOS = {
			'status._id': {
				$in: [1, 2, 3, 8, 9]
			}
		};
		$scope.filterWO = {
			'status._id': {
				$in: [1, 2, 3, 9]
			}
		};
		$scope.filterC = {
			'role._id': 3
		};
		$scope.filterDO = {
			'status._id': {
				$in: [1, 2, 3, 4, 8, 11]
			}
		};
		$scope.filterSetup = {
			'status._id': {
				$in: [1, 2, 3, 4, 8]
			}
		};

		$scope.wsClassItem = Item;
		$scope.wsFilterItem = $rootScope.userData.role._id != 1 ? { 'companies._id': $rootScope.userData.company._id } : {};
		$scope.wsFieldsItem = [{
			label: 'Code',
			field: 'code',
			type: 'text',
			show: true
		}, {
			label: 'Description',
			field: 'description',
			type: 'text',
			show: true
		}, {
			label: 'Part',
			field: 'part',
			type: 'text',
			show: true
		}, {
			label: 'Unit of Measure',
			field: 'unitOfMeasure',
			type: 'text',
			show: true
		}, {
			label: 'Price',
			field: 'price',
			type: 'currency',
			show: true
		}
		];


		$scope.setInvoice = function (doc) {
			$scope.invoice = new Invoice(doc);
			$scope.invoice.date = new Date();
			$scope.expensesNewItem = {}

			for (var row = 0; row < $scope.invoice.items.length; row++) {
				if ($scope.invoice.wor || $scope.invoice.sor) {
					var element = $scope.invoice.items[row].CrewLeaderSelected
				} else {
					var element = $scope.invoice.items[row].crewLeaderCol
				}
				if (element != undefined) {
					$scope.expensesNewItem = {
						description: $scope.invoice.items[row].description,
						price: element.price,
						technician: element.techId + ' - ' + element.name,
						quantity: $scope.invoice.items[row].quantity,
						total: $scope.invoice.items[row].quantity * element.price
					}
					$scope.expenses.push($scope.expensesNewItem)
				}
			}
			if ($scope.expenses != undefined) {
				$scope.invoice.expenses = $scope.expenses
			}

			if ($scope.invoice.dor) {
				$scope.invoice.comment = $scope.invoice.comments
			}

			delete $scope.invoice._id;
			$scope.clientChanged(doc.client);
		};

		$scope.clientChanged = function (client) {
			if (client && client.company)
				$scope.wsFilterItem = $rootScope.userData.role._id != 1 ? { 'companies._id': $rootScope.userData.company._id } : { 'companies._id': client.company._id };
			if (!$scope.invoice._id && (!$scope.invoice.invoiceNumber || $scope.invoice.invoiceNumber == 'Pending Invoice')) {
				var company = new Company(client.company);

				if ($scope.invoice.tor) {
					company.setupTearDown($scope.invoice.tor)
						.then(function (sequence) {
							$scope.invoice.invoiceNumber = sequence;
						});
				} else {
					company.peek($scope.invoice.dor)
						.then(function (sequence) {
							$scope.invoice.invoiceNumber = sequence;
						});
				}
			}
		};
		$scope.addItem = function () {
			$scope.invoice.items.unshift(new Item())
		};
		$scope.removeItem = function (index) {
			$scope.invoice.items.splice(index, 1);
		};
		$scope.setItem = function (item, index) {
			$scope.invoice.items[index] = new Item(item);
		};

		$scope.changed = function (field) {
			if ($scope.invoice._id && $rootScope.userData.role._id != 1) {
				var isHere = false;
				$scope.invoice.fieldsChanged = $scope.invoice.fieldsChanged || [];
				for (var i = 0; i < $scope.invoice.fieldsChanged.length; i++) {
					if ($scope.invoice.fieldsChanged[i] == field) {
						isHere = true;
						break;
					}
				}
				if (!isHere) {
					$scope.invoice.fieldsChanged.push(field);
				}
			}
		};
		$scope.isChanged = function (field) {
			if ($scope.invoice._id && $rootScope.userData.role._id == 1) {
				var isHere = false;
				$scope.invoice.fieldsChanged = $scope.invoice.fieldsChanged || [];
				for (var i = 0; i < $scope.invoice.fieldsChanged.length; i++) {
					if ($scope.invoice.fieldsChanged[i] == field) {
						isHere = true;
						break;
					}
				}
				return isHere ? 'changed' : '';
			}
			return '';
		};
		$scope.isDisabled = function () {
			return $rootScope.userData.role._id != 1 && $scope.invoice.status._id == 3;
		};

		$scope.save = function (sendTotech) {
			$scope.waiting = true;
			delete $scope.invoice.client.account.password;

			if ($scope.invoice.dor) {
				if ($scope.invoice.status._id == 11) {
					$scope.invoice.status._id = 4
					$scope.invoice.status.description = 'Delivered'
				}
			} else {
				if ($scope.invoice.status._id == 9) {
					$scope.invoice.status._id = 3
					$scope.invoice.status.description = 'Completed'
				}
			}

			$scope.invoice.saveSendTo = false;
			$scope.invoice.save()
				.then(function (data) {
					$scope.updateDoc(sendTotech)
					toaster.success('The Invoice was saved successfully');
					$location.path('invoiceList')
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					toaster.error('The Invoice couldn\'t be saved, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};

		$scope.saveBranch = function () {
			$scope.waiting = true;
			delete $scope.invoice.client.account.password;
			$scope.invoice.saveSendTo = false;

			if ($scope.invoice.dor) {
				if ($scope.invoice.status._id == 11) {
					$scope.invoice.status._id = 4
					$scope.invoice.status.description = 'Delivered'
				}
			} else {
				if ($scope.invoice.status._id == 9) {
					$scope.invoice.status._id = 3
					$scope.invoice.status.description = 'Completed'
				}
			}

			$scope.invoice.save()
				.then(function (data) {
					$scope.updateDoc(false)
					new User().filter({ 'branch._id': $scope.invoice.client.branch._id })
						.then(function (result) {
							var emails = _.map(result.data, function (obj) {
								return obj.account.email;
							});
							$scope.invoice.sendTo(emails)
								.then(function () {
									$scope.waiting = false;

								});
						})
				},
				function (error) {
					console.log(error);
					toaster.error('The Invoice couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};
		$scope.saveCompany = function () {
			$scope.waiting = true;
			delete $scope.invoice.client.account.password;

			$scope.statusTech = {
				_id: 1,
				description: "Payment Run"
			}
			if ($scope.invoice.dor) {
				if ($scope.invoice.status._id == 11) {
					$scope.invoice.status._id = 4
					$scope.invoice.status.description = 'Delivered'
				}
			} else {
				if ($scope.invoice.status._id == 9) {
					$scope.invoice.status._id = 3
					$scope.invoice.status.description = 'Completed'
				}
			}
			$scope.invoice.statusTech = $scope.statusTech;
			$scope.invoice.saveSendTo = false;
			$scope.invoice.save()
				.then(function (data) {
					$scope.updateDoc(false)
					new Company().filter({ _id: $scope.invoice.client.company._id })
						.then(function (result) {
							var emails = _.map(result.data, function (obj) {
								return obj.accountPayableEmail;
							});
							if (result.data[0].sendCorporateMails) {
								for (var i = 0; i < result.data[0].sendCorporateMails.length; i++) {
									emails.push(result.data[0].sendCorporateMails[i]);
								}
							};
							emails.push($scope.invoice.client.account.email);
							$scope.invoice.sendTo(emails, true)
								.then(function () {
									$scope.waiting = false;
								});
						})
				},
				function (error) {
					console.log(error);
					toaster.error('The Invoice couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};
		$scope.saveSend = function () {
			$scope.waiting = true;
			delete $scope.invoice.client.account.password;
			$scope.invoice.saveSendTo = true;
			if ($scope.invoice.dor) {
				if ($scope.invoice.status._id == 11) {
					$scope.invoice.status._id = 4
					$scope.invoice.status.description = 'Delivered'
				}
			} else {
				if ($scope.invoice.status._id == 9) {
					$scope.invoice.status._id = 3
					$scope.invoice.status.description = 'Completed'
				}
			}
			$scope.invoice.save()
				.then(function (data) {
					$scope.updateDoc(false)
					toaster.success('The Invoice was saved successfully');
					$scope.invoice.send();
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					toaster.error('The Invoice couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};


		$scope.delete = function () {
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to delete?');
			dlg.result.then(function (btn) {
				$scope.invoice.remove()
					.then(function () {
						toaster.success('The invoice was deleted successfully');
						$location.path('/invoiceList')
					})
					.then(function () {
						$scope.invoice.sendDelete($scope.invoice);
					});
			});
		};
		$scope.export = function () {
			$scope.invoice.download();
		};

		$scope.send = function () {
			$scope.invoice.send();
		};

		$scope.showExpenses = function () {
			console.log($scope.invoice)
			var dialog = dialogs.create('views/expenses.html', 'ExpensesCtrl', {
				expenses: $scope.invoice.expenses,
				expensesComplete: $scope.invoice.expensesComplete,
				technician: $scope.invoice.technician
			});
			dialog.result
				.then(function (res) {
					$scope.invoice.expenses = angular.copy(res.expenses);
					$scope.invoice.expensesComplete = angular.copy(res.expensesComplete);
					$scope.invoice.technician = angular.copy(res.technician);
				});
		};
		$scope.setAmountToZero = function (status) {
			if (status._id == 5 || status._id == 7) {
				for (var i = 0; i < $scope.invoice.items.length; i++) {
					$scope.invoice.items[i].originalPrice = $scope.invoice.items[i].price;
					$scope.invoice.items[i].price = 0;
				}
			} else {
				for (var i = 0; i < $scope.invoice.items.length; i++) {
					$scope.invoice.items[i].price = $scope.invoice.items[i].originalPrice ? $scope.invoice.items[i].originalPrice : $scope.invoice.items[i].price;
					delete $scope.invoice.items[i].originalPrice;
				}
			}
		}
		if (invoice.client) {
			$scope.clientChanged(invoice.client);
		}

		$scope.updateDoc = function (sendTotech) {
			if ($scope.invoice.typeTruck == undefined && $scope.invoice.sor) {
 				new ServiceOrder().filter({ "sor": $scope.invoice.sor })
					.then(function (result) {
						_.map(result.data, function (obj) {
							$scope.ServiceOrder = obj
							$scope.ServiceOrder.status = $scope.invoice.status
							$scope.ServiceOrder.sendTotech = sendTotech
							$scope.ServiceOrder.statusTech = $scope.statusTech;
							$scope.ServiceOrder.sendMail = false;
							$scope.ServiceOrder.quotes = 0
						});
						if ($scope.invoice.status._id == 9) {
							$scope.ServiceOrder.status._id = 3
							$scope.ServiceOrder.status.description = 'Completed'
						}
						$scope.ServiceOrder.save()
					}) 
			}
			if ($scope.invoice.typeTruck == undefined && $scope.invoice.wor) {
				new WorkOrder().filter({ "wor": $scope.invoice.wor })
					.then(function (result) {
						_.map(result.data, function (obj) {
							$scope.WorkOrder = obj
							$scope.WorkOrder.status = $scope.invoice.status
							$scope.WorkOrder.sendTotech = sendTotech
							$scope.WorkOrder.statusTech = $scope.statusTech;
							$scope.WorkOrder.sendMail = false;
							$scope.WorkOrder.quotes = 0
						});
						if ($scope.invoice.status._id == 9) {
							$scope.WorkOrder.status._id = 3
							$scope.WorkOrder.status.description = 'Completed'
						}
						$scope.WorkOrder.save()
					})
			}
			if ($scope.invoice.typeTruck && $scope.invoice.dor) {
				new DeliveryOrder().filter({ "dor": $scope.invoice.dor })
					.then(function (result) {
						_.map(result.data, function (obj) {
							$scope.DeliveryOrder = obj
							$scope.DeliveryOrder.status = $scope.invoice.status
							$scope.DeliveryOrder.sendMail = false;
							$scope.DeliveryOrder.invoiceId = $scope.invoice._id
						});
						if ($scope.invoice.status._id == 11) {
							$scope.DeliveryOrder.status._id = 4
							$scope.DeliveryOrder.status.description = 'Delivered'
						}
						$scope.DeliveryOrder.save()
					})
			}
			if ($scope.invoice.quotes) {
				new ServiceQuotes().filter({ "quotesNumber": $scope.invoice.quotesNumber })
					.then(function (result) {
						_.map(result.data, function (obj) {
							$scope.ServiceQuotes = obj
							$scope.ServiceQuotes.invoiceNumber = $scope.invoice.invoiceNumber;
							$scope.ServiceQuotes.pono = $scope.invoice.pono;
							$scope.ServiceQuotes.unitSize = $scope.invoice.unitSize;
							$scope.ServiceQuotes.unitno = $scope.invoice.unitno;
							$scope.ServiceQuotes.isono = $scope.invoice.isono;
							$scope.ServiceQuotes.quotes = 0
						});
						if ($scope.invoice.status._id == 9) {
							$scope.ServiceQuotes.status._id = 3
							$scope.ServiceQuotes.status.description = 'Completed'
						}
						$scope.ServiceQuotes.save()
					})
			}
		}
	});
