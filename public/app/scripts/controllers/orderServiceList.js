'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('OrderServiceListCtrl', function ($scope, $location, OrderService) {
	$scope.orderService = OrderService;

	$scope.fields = [{
			title : 'Created Date',
			name : 'createdDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
			type : 'text'
		}, {
			title : 'Client',
			name : 'client.entity.fullName',
			type : 'text'
		}, {
			title : 'Status',
			name : 'status.description',
			type : 'text'
		}, {
			title : 'Total Amount',
			name : 'total',
			type : 'int'
		}
	];

	$scope.search = [
		'_id',
		'createdDate',
		'invoiceNumber',
		'client.entity',
		'status.description',
		'total'
	];

	$scope.createNew = function () {
		$location.path('orderService');
	};
});
