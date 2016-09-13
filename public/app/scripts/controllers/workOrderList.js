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
			title : 'Created Date',
			name : 'createdDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
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
		'client.entity',
		'client.entity.fullName',
		'status.description',
		'total'
	];

	$scope.filter = $rootScope.userData.role._id == 1 ? { } : { 'client._id': $rootScope.userData._id };

	$scope.createNew = function () {
		$location.path('workOrder');
	};
});
