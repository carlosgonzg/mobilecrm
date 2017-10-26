'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('paymentListCtrl', function ($scope, $rootScope, $location, paymentRunWO, paymentRun) { 

		$scope.filterPayment = []
		$scope.showMessage = false;

		$scope.roles = [
			{ description: "Service Order" },
			{ description: "Work Order" }
		];

		$scope.DataSO = paymentRun
		$scope.Fieldpending = [{
			title: 'Service Order #',
			name: 'sor',
			type: 'text'
		}, {
			title: 'Date',
			name: 'date',
			type: 'date'
		}, {
			title: 'Customer',
			name: 'customer',
			type: 'text'
		}, {
			title: 'Company',
			name: 'client.company.entity.name',
			type: 'text'
		}, {
			title: 'City',
			name: 'siteAddressFrom.city.description',
			type: 'text'
		}
		];

		$scope.search = [
			'sor',
			'date',
			'customer',
			'client.company.entity.name',
			'siteAddressFrom.city.description'
		];

		//schema para work order   ///////////////////////////////////////////////////////////////////////////////////////////////////////

		$scope.DataWO = paymentRunWO
		$scope.FieldpendingWO = [{
			title: 'Work order #',
			name: 'wor',
			type: 'text'
		}, {
			title: 'Customer',
			name: 'client.entity.fullName',
			type: 'text'
		}, {
			title: 'Company',
			name: 'client.company.entity.name',
			type: 'text'
		}, {
			title: 'Date',
			name: 'date',
			type: 'date'
		}, {
			title: 'City',
			name: 'client.company.address.city.description',
			type: 'text'
		}
		];	

		$scope.searchWO = [
			'wor',			
			'client.entity.fullName',
			'client.company.entity.name',	
			'date',
			'client.company.address.city.description'
		];

		$scope.selectTab = function (role) {
			$scope.selectedTab = role.description;

			$scope.pending = 0
			$scope.completed = 0

			$scope.filter()

			if (role.description == "Service Order") {
				$scope.pending = 1
			}
			if (role.description == "Work Order") {
				$scope.completed = 1
			}
		};

		$scope.filter = function () {
			$scope.filterPayment = {
				'statusTech._id': 1
			}
		}
		$scope.selectTab($scope.roles[0]);
		$scope.filter();
	});
