'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('SetupTearDownListCtrl', function ($scope, $rootScope, $location, SetupTearDown) {
		$scope.SetupTearDown = SetupTearDown;

		$scope.fields = [{
			title: 'Company',
			name: 'client.company.entity.name',
			type: 'text'
		}, {
			title: 'Branch',
			name: 'client.branch.name',
			type: 'text'
		}, {
			title: 'Customer',
			name: 'client.entity.fullName',
			type: 'text'
		}, {
			title: 'Completed Date',
			name: 'originalShipDate',
			type: 'date'
		}, {
			title: 'Invoice #',
			name: 'invoiceNumber',
			type: 'text'
		}, {
			title: 'Set Up #',
			name: 'tor',
			type: 'text'
		}, {
			title: 'Serial #',
			name: 'unitno',
			type: 'text'
		}, {
			title: 'Unit Size',
			name: 'unitSize',
			type: 'text'
		}, {
			title: 'PO #',
			name: 'pono',
			type: 'text'
		}, {
			title: 'Total Amount',
			name: 'total',
			type: 'function',
			function: function (elem) { return elem.total + (elem.client.company.taxes || 0) * elem.total }
		}, {
			title: 'Status',
			name: 'status.description',
			type: 'text'
		}
		];

		$scope.search = [
			'_id',
			'client.company.entity.name',
			'client.branch.name',
			'client.entity.fullName',
			'originalShipDate',
			'invoiceNumber',
			'tor',
			'unitno',
			'pono',
			'total',
			'status.description',
			'client.branch',
			'client.company',
			'unitSize'
		];

		$scope.filterDate = 'date';
		$scope.excelFields = [{
			title: 'Company',
			name: 'client.company.entity.name',
			type: 'text'
		}, {
			title: 'Branch',
			name: 'client.branch.name',
			type: 'text'
		}, {
			title: 'Customer',
			name: 'client.entity.fullName',
			type: 'text'
		}, {
			title: 'Set Up Date',
			name: 'originalShipDate',
			type: 'date'
		}, {
			title: 'Invoice #',
			name: 'invoiceNumber',
			type: 'text'
		}, {
			title: 'Set Up #',
			name: 'tor',
			type: 'text'
		}, {
			title: 'Serial #',
			name: 'unitno',
			type: 'text'
		}, {
			title: 'Unit Size',
			name: 'unitSize',
			type: 'text'
		}, {
			title: 'PO #',
			name: 'pono',
			type: 'text'
		}, {
			title: 'Total Amount',
			name: 'total',
			type: 'currency'
		}, {
			title: 'Status',
			name: 'status.description',
			type: 'text'
		}
		];

		$scope.filter = $rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 5 ? {} : $rootScope.userData.branch && $rootScope.userData.branch._id ? { 'client.branch._id': $rootScope.userData.branch._id } : { 'client._id': $rootScope.userData._id };

		$scope.createNew = function () {
			$location.path('SetupTearDown');
		};
	});
