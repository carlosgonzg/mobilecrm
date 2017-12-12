'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('InvoiceListCtrl', function ($scope, $rootScope, $location, Invoice) {

	$scope.invoice =  Invoice;
	

	$scope.fields = [{
			title : 'Company',
			name : 'client.company.entity.name',
			type : 'text'
		},{
			title : 'Branch',
			name : 'client.branch.name',
			type : 'text'
		},{
			title : 'Date',
			name : 'date',
			type : 'date'
		},{
			title : 'Due Date',
			name : 'dueDate',
			type : 'date'
		},{
			title : 'Completed Date',
			name : 'originalShipDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
			type : 'text'
		}, {
			title : 'Serial #',
			name : 'unitno',
			type : 'text'
		}, {
			title : 'Customer',
			name : 'client.entity.fullName',
			type : 'text'
		}, {
			title : 'Status',
			name : 'status.description',
			type : 'text'
		}, {
			title : 'Amount',
			name : 'total',
			type : 'function',
			function: function (elem){ return elem.total + (elem.client.company.taxes || 0) * elem.total}
		}, {
			title : 'Expenses',
			name : 'expensesComplete',
			type : 'checkbox'
		}
	];
	// if($rootScope.userData.role._id == 1){
	// 	$scope.fields.push({
	// 		title : 'Total Amount',
	// 		name : 'total',
	// 		type : 'currency'
	// 	});
	// }
	$scope.search = [
		'_id',
		'createdDate',
		'date',
		'originalShipDate',
		'invoiceNumber',
		'client.company.entity.name',
		'client.branch.name',
		'sor',
		'wor',
		'unitno',
		'client.branch',
		'client.company',
		'client.entity',
		'client.entity.fullName',
		'status.description',
		'total',
		'expensesComplete'
	];
	$scope.filterDate = 'createdDate';

  $scope.excelFields = [{
      title : 'Created Date',
      name : 'createdDate',
      type : 'date'
    }, {
      title : 'SOR',
      name : 'sor',
      type : 'text'
    }, {
      title : 'Invoice #',
      name : 'invoiceNumber',
      type : 'text'
    }, {
		title : 'Unit #',
		name : 'unitno',
		type : 'text'
	}, {
      title : 'Customer',
      name : 'client.entity.fullName',
      type : 'text'
    }, {
      title : 'Status',
      name : 'status.description',
      type : 'text'
    }, {
      title : 'Total Amount',
      name : 'total',
      type : 'currency'
    }, {
      title : 'Expenses',
      name : 'expensesComplete',
      type : 'boolean'
    }
  ];

	$scope.filter = $rootScope.userData.role._id == 1 ? { } : $rootScope.userData.branch && $rootScope.userData.branch._id ?  { 'client.branch._id': $rootScope.userData.branch._id } : { 'client._id': $rootScope.userData._id };
	
	$scope.createNew = function () {
		$location.path('invoice');
	};
});
