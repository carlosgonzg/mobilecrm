'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('DeliveryOrderListCtrl', function ($scope, $rootScope, $location, DeliveryOrder) {
		$scope.DeliveryOrder = DeliveryOrder;

		$scope.fields = [{
			title: 'Company',
			name: 'client.company.entity.name',
			type: 'text'
		}, {
			title: 'Date',
			name: 'date',
			type: 'date'
		}, {
			title: 'Invoice #',
			name: 'invoiceNumber',
			type: 'text'
		}, {
			title: 'Delivery Order #',
			name: 'dor',
			type: 'text'
		}, {
			title: 'Customer',
			name: 'client.entity.fullName',
			type: 'text'
		}, {
			title: 'Status',
			name: 'status.description',
			type: 'text'
		}, {
			title: 'Po#',
			name: 'pono',
			type: 'text'
		}, {
			title: 'Total Amount',
			name: 'total',
			type: 'currency'
		}
		];

		$scope.search = [
			'_id',
			'client.company.entity.name',
			'date',
			'invoiceNumber',
			'dor',
			'client.entity.fullName',
			'status.description',
			'pono',
			'total'
		];

		$scope.filterDate = 'date';
		$scope.excelFields = [{
			title: 'Company',
			name: 'client.company.entity.name',
			type: 'text'
		}, {
			title: 'Date',
			name: 'date',
			type: 'date'
		}, {
			title: 'Invoice #',
			name: 'invoiceNumber',
			type: 'text'
		}, {
			title: 'Delivery Order #',
			name: 'dor',
			type: 'text'
		}, {
			title: 'Customer',
			name: 'client.entity.fullName',
			type: 'text'
		}, {
			title: 'Status',
			name: 'status.description',
			type: 'text'
		}, {
			title: 'Po#',
			name: 'pono',
			type: 'text'
		}, {
			title: 'Total Amount',
			name: 'total',
			type: 'currency'
		}
		];

		$scope.filter = $rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 6 ? {} : $rootScope.userData.branch && $rootScope.userData.branch._id ? { 'client.branch._id': $rootScope.userData.branch._id } : { 'client._id': $rootScope.userData._id };

		$scope.createNew = function () {
			$location.path('DeliveryOrder');
		};
	});


