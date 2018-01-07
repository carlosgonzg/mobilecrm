'use strict';
'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('serviceQuotesListCtrl', function ($scope, $rootScope, $location, ServiceQuotes) {
		$scope.ServiceQuotes = ServiceQuotes;

		$scope.roles = [
			{ description: "Pending for Approval" },
			{ description: "Approved" }
		];
		$scope.approved = []

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
			title: 'Estimate #',
			name: 'quotesNumber',
			type: 'text'
		}, {
			title: 'Service Type',
			name: 'serviceType.description',
			type: 'text'
		}, {
			title: 'Serial #',
			name: 'unitno',
			type: 'text'
		}, {
			title: 'PO #',
			name: 'pono',
			type: 'text'
		}, {
			title: 'Total Amount',
			name: 'total',
			type: 'function',
			function: function (elem) { return elem.taxes ? (((elem.taxes * elem.total) / 100) + elem.total) : elem.total }
		}
		];

		$scope.search = [
			'_id',
			'client.company.entity.name',
			'client.branch.name',
			'client.entity.fullName',
			'originalShipDate',
			'quotesNumber',
			"serviceType.description",
			'unitno',
			'pono',
			'total',
			'taxes'
		];

		$scope.filterDate = 'date';

		$scope.selectTab = function (role) {
			$scope.selectedTab = role.description;

			$scope.pending = 0
			$scope.completed = 0

			$scope.filter()

			if (role.description == "Pending for Approval") {
				$scope.pending = 1
			}
			if (role.description == "Approved") {
				$scope.completed = 1
			}
		};
		$scope.filter = function () {
			$scope.approval = {
				'approved': 1
			}
			$scope.approved = {
				'approved': 2
			}
		}
		$scope.filter()
		$scope.selectTab($scope.roles[0]);
		$scope.createNew = function () {
			$location.path('serviceQuotes');
		};
	});
