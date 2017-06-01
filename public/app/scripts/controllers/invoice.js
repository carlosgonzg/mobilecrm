'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('InvoiceCtrl', function ($scope, $rootScope, $location, toaster, User, invoice, statusList, Item, ServiceOrder, WorkOrder, dialogs, Invoice, Company, companies) {
	$scope.invoice = invoice;
	$scope.items = [];
	$scope.readOnly = $rootScope.userData.role._id != 1;
	if($rootScope.userData.role._id != 1){
		$scope.invoice.client = new User($rootScope.userData);
	}
	$scope.listStatus = statusList;
	$scope.listCompany = companies.data;

	$scope.wsClassOS = ServiceOrder;
	$scope.wsFieldsOS = [{
			label : 'Service Order #',
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
			label : 'Company',
			field : 'client.company.entity.name',
			type : 'text',
			show: true
		}, {
			label : 'Branch',
			field : 'client.branch.name',
			type : 'text',
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
			label : 'Work Order #',
			field : 'wor',
			type : 'text',
			show: true
		},{
			label : 'Created Date',
			field : 'createdDate',
			type : 'date',
			show: true
		},{
			label : 'Unit #',
			field : 'unitno',
			type : 'text',
			show: true
		}, {
			label : 'Company',
			field : 'client.company.entity.name',
			type : 'text',
			show: true
		}, {
			label : 'Branch',
			field : 'client.branch.name',
			type : 'text',
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

	$scope.wsClassItem = Item;
	$scope.wsFilterItem =  $rootScope.userData.role._id != 1 ? { 'companies._id': $rootScope.userData.company._id }: { };
	$scope.wsFieldsItem = [{
			label : 'Code',
			field : 'code',
			type : 'text',
			show: true
		},{
			label : 'Description',
			field : 'description',
			type : 'text',
			show: true
		},{
			label : 'Part',
			field : 'part',
			type : 'text',
			show: true
		},{
			label : 'Unit of Measure',
			field : 'unitOfMeasure',
			type : 'text',
			show: true
		}, {
			label : 'Price',
			field : 'price',
			type : 'currency',
			show: true
		}
	];

	$scope.setInvoice = function(doc){
		$scope.invoice = new Invoice(doc);
		$scope.invoice.date = new Date();
		delete $scope.invoice._id;
		$scope.clientChanged(doc.client);
	};

	$scope.clientChanged = function(client){
		if(client && client.company)
			$scope.wsFilterItem =  $rootScope.userData.role._id != 1 ? { 'companies._id': $rootScope.userData.company._id } : { 'companies._id': client.company._id };
		if(!$scope.invoice._id && (!$scope.invoice.invoiceNumber || $scope.invoice.invoiceNumber == 'Pending Invoice')){
			var company = new Company(client.company);
			company.peek()
			.then(function(sequence){
				$scope.invoice.invoiceNumber = sequence;
			});
		}
	};
	$scope.addItem = function () {
		$scope.invoice.items.unshift(new Item())
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
			toaster.error('The Invoice couldn\'t be saved, please check if some required field is empty or if its duplicated');
		});
	};
	$scope.saveBranch = function () {
		delete $scope.invoice.client.account.password;
		$scope.invoice.save()
		.then(function (data) {
			new User().filter({ 'branch._id': $scope.invoice.client.branch._id })
			.then(function (result) {
				var emails = _.map(result.data, function(obj){
					return obj.account.email;
				});
				$scope.invoice.sendTo(emails);
			})
		},
		function (error) {
			console.log(error);
			toaster.error('The Invoice couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
		});
	};
	$scope.saveCompany = function () {
		delete $scope.invoice.client.account.password;
		$scope.invoice.save()
		.then(function (data) {
			new Company().filter({ _id: $scope.invoice.client.company._id })
			.then(function (result) {
				var emails = _.map(result.data, function(obj){
					return obj.accountPayableEmail;
				});
				emails.push($scope.invoice.client.account.email);
				$scope.invoice.sendTo(emails, true);
			})
		},
		function (error) {
			console.log(error);
			toaster.error('The Invoice couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
		});
	};
	$scope.saveSend = function () {
		delete $scope.invoice.client.account.password;
		$scope.invoice.save()
		.then(function (data) {
			toaster.success('The Invoice was saved successfully');
			$scope.invoice.send();
		},
		function (error) {
			console.log(error);
			toaster.error('The Invoice couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
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

	$scope.showExpenses = function(){
		var dialog = dialogs.create('views/expenses.html', 'ExpensesCtrl', { expenses: $scope.invoice.expenses });
		dialog.result
		.then(function (res) {
			$scope.invoice.expenses = angular.copy(res);
		});
	};
	if(invoice.client){
		$scope.clientChanged(invoice.client);
	}
});
