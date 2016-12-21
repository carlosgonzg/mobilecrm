'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('InvoiceCtrl', function ($scope, $rootScope, $location, toaster, User, invoice, items, statusList, Item, ServiceOrder, WorkOrder, dialogs, Invoice) {
	$scope.invoice = invoice;
	$scope.items = [];
	$scope.readOnly = $rootScope.userData.role._id != 1;
	if($rootScope.userData.role._id != 1){
		$scope.invoice.client = new User($rootScope.userData);
	}
	$scope.listStatus = statusList;


	$scope.wsClassOS = ServiceOrder;
	$scope.wsFieldsOS = [{
			label : 'SOR/Service Order #',
			field : 'sor',
			type : 'text',
			show: true
		},{
			label : 'Created Date',
			field : 'createdDate',
			type : 'date',
			show: true
		},{
			label : 'Completed Date',
			field : 'originalShipDate',
			type : 'date',
			show: true
		}, {
			label : 'Customer',
			field : 'client.entity.fullName',
			type : 'text',
			show: true
		}, {
			label : 'Status',
			field : 'status.description',
			type : 'text',
			show: true
		}, {
			label : 'Total Amount',
			field : 'total',
			type : 'currency',
			show: true
		}
	];
	$scope.wsClassWO = WorkOrder;
	$scope.wsFieldsWO = [{
			label : 'WOR/Work Order #',
			field : 'wor',
			type : 'text',
			show: true
		},{
			label : 'Created Date',
			field : 'createdDate',
			type : 'date',
			show: true
		},{
			label : 'Completed Date',
			field : 'originalShipDate',
			type : 'date',
			show: true
		}, {
			label : 'Customer',
			field : 'client.entity.fullName',
			type : 'text',
			show: true
		}, {
			label : 'Status',
			field : 'status.description',
			type : 'text',
			show: true
		}, {
			label : 'Total Amount',
			field : 'total',
			type : 'currency',
			show: true
		}
	];
	$scope.wsClass = User;
	$scope.wsFields = [{
			field : 'entity.fullName',
			label : 'Name',
			type : 'text',
			show : true
		}, {
			field : 'account.email',
			label : 'Email',
			type : 'text',
			show: true
		}, {
			field : 'company.entity.name',
			label : 'Company',
			type : 'text',
			show: true
		}, {
			field : 'branch.name',
			label : 'Branch',
			type : 'text',
			show: true
		}
	];
	$scope.filterOS = {
		'status._id': {
			$in: [1, 2, 3]
		} 
	};
	$scope.filterWO = {
		'status._id': {
			$in: [1, 2, 3]
		} 
	};
	$scope.filterC = {
		'role._id': {
			$ne: 1
		} 
	};

	$scope.setInvoice = function(serviceOrder){
		$scope.invoice = new Invoice(serviceOrder);
		delete $scope.invoice._id;
	};

	$scope.clientChanged = function(client){
		$scope.items = [];
		for(var i = 0; i < items.data.length; i++){
			if(!items.data[i].clients || !items.data[i].companies){
				$scope.items.push(items.data[i]);
			}
			else {
				for(var j = 0; j < items.data[i].clients.length; j++){
					if(items.data[i].clients[j]._id == client._id){
						$scope.items.push(items.data[i]);
						break;
					}
				}
				for(var j = 0; j < items.data[i].companies.length; j++){
					if(items.data[i].companies[j]._id == client.company._id){
						$scope.items.push(items.data[i]);
						break;
					}
				}
			}
		}
	};
	
	$scope.addItem = function () {
		$scope.invoice.items.push(new Item())
	};
	$scope.removeItem = function (index) {
		$scope.invoice.items.splice(index, 1);
	};
	$scope.setItem = function(item, index) {
		$scope.invoice.items[index] = new Item(item);
	};

	$scope.changed = function(field){
		if($scope.invoice._id && $rootScope.userData.role._id != 1){
			var isHere = false;
			$scope.invoice.fieldsChanged = $scope.invoice.fieldsChanged || [];
			for(var i = 0; i < $scope.invoice.fieldsChanged.length; i++){
				if($scope.invoice.fieldsChanged[i] == field){
					isHere = true;
					break;
				}
			}
			if(!isHere){
				$scope.invoice.fieldsChanged.push(field);
			}
		} 
	};
	$scope.isChanged = function(field){
		if($scope.invoice._id && $rootScope.userData.role._id == 1){
			var isHere = false;
			$scope.invoice.fieldsChanged = $scope.invoice.fieldsChanged || [];
			for(var i = 0; i < $scope.invoice.fieldsChanged.length; i++){
				if($scope.invoice.fieldsChanged[i] == field){
					isHere = true;
					break;
				}
			}
			return isHere ? 'changed' : '';
		}
		return '';
	};
	$scope.isDisabled = function(){
		return $rootScope.userData.role._id != 1 && $scope.invoice.status._id == 3;
	};

	
	$scope.save = function () {
		delete $scope.invoice.client.account.password;
		$scope.invoice.save()
		.then(function (data) {
			toaster.success('The Invoice was saved successfully');
			$location.path('invoiceList')
		},
			function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};
	$scope.delete = function(){
		var dlg = dialogs.confirm('Warning','Are you sure you want to delete?');
		dlg.result.then(function(btn){
			$scope.invoice.remove()
			.then(function(){
				toaster.success('The invoice was deleted successfully');
				$location.path('/invoiceList')
			});
		});
	};
	$scope.export = function(){
		$scope.invoice.download();
	};

	$scope.send = function(){
		$scope.invoice.send();
	};
});
