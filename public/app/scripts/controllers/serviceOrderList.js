'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ServiceOrderListCtrl', function ($scope, $rootScope, $location, ServiceOrder) {
	$scope.serviceOrder = ServiceOrder;

	$scope.fields = [{
			title : 'Company',
			name : 'client.company.entity.name',
			type : 'text'
		},{
			title : 'Branch',
			name : 'client.branch.name',
			type : 'text'
		},{
			title : 'Created Date',
			name : 'createdDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
			type : 'text'
		}, {
			title : 'SOR/Service Order #',
			name : 'sor',
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
		'_id',
		'createdDate',
		'invoiceNumber',
		'sor',
		'client.branch',
		'client.company',
		'client.entity',
		'client.entity.fullName',
		'status.description',
		'total'
	];
	$scope.filterDate = 'createdDate';

  $scope.excelFields = [{
			title : 'Company',
			name : 'client.company.entity.name',
			type : 'text'
		},{
			title : 'Branch',
			name : 'client.branch.name',
			type : 'text'
		},{
			title : 'Created Date',
			name : 'createdDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
			type : 'text'
		}, {
			title : 'SOR/Service Order #',
			name : 'sor',
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

	$scope.filter = $rootScope.userData.role._id == 1 ? { } : { 'client._id': $rootScope.userData._id };

	$scope.createNew = function () {
		$location.path('serviceOrder');
	};
});
