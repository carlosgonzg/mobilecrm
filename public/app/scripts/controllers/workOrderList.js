'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('WorkOrderListCtrl', function ($scope, $rootScope, $location, WorkOrder) {
	$scope.workOrder = WorkOrder;

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
			title : 'Completed Date',
			name : 'originalShipDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
			type : 'text'
		}, {
			title : 'Work Order #',
			name : 'wor',
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
		}
	];

	$scope.search = [
		'wor',
		'client.company.entity.name',
		'client.branch.name',
		'invoiceNumber',
		'unitno',
		'status.description',
    'total',
    'client.entity.fullName'
	];
	$scope.filterDate = 'date';

  $scope.excelFields = [{
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
			title : 'Completed Date',
			name : 'originalShipDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
			type : 'text'
		}, {
			title : 'Work Order #',
			name : 'wor',
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
		}
  ];

	$scope.filter = $rootScope.userData.role._id == 1 ? { } : $rootScope.userData.branch && $rootScope.userData.branch._id ?  { 'client.branch._id': $rootScope.userData.branch._id } : { 'client._id': $rootScope.userData._id };
	
	$scope.createNew = function () {
		$location.path('workOrder');
	};
});
