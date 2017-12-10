'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('technicianListCtrl', function ($scope, $rootScope, $location, technicians, techniciansWO ) {

		var wsPending = technicians
		var wsCompleted = technicians
		var wsPayment = technicians
		var wsPaid = technicians
		
		var wsPendingWO = techniciansWO;
		var wsCompletedWO = techniciansWO
		var wsPaymentWO = techniciansWO
		var wsPaidWO = techniciansWO

		$scope.showMessage = false;

		$scope.roles = [
			{ description: "Pending"},
			{ description: "Completed" },
			{ description: "Payment Run" },
			{ description: "Paid" }
		];

		$scope.DataPending = wsPending
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

		$scope.DataCompleted = wsCompleted
		$scope.Fieldcompleted = [{
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

		$scope.DataCompleted = wsCompleted
		$scope.Fieldcompleted = [{
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
		
		$scope.DatawsPayment = wsPayment
		$scope.FieldwsPayment = [{
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
		
		$scope.DatawsPaid = wsPaid
		$scope.FieldwsPaid = [{
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

		$scope.DataPendingWO = wsPendingWO
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
			name: 'siteAddress.city.description',
			type: 'text'
		}
		];	

		$scope.DataCompletedWO = wsCompletedWO
		$scope.FieldCompletedWO = [{
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
			name: 'siteAddress.city.description',
			type: 'text'
		}
		];	

		$scope.DataPaymentWO = wsPaymentWO
		$scope.FieldCompletedWO = [{
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
			name: 'siteAddress.city.description',
			type: 'text'
		}
		];	

		$scope.DataPaidWO = wsPaidWO
		$scope.FieldPaiddWO = [{
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
			name: 'siteAddress.city.description',
			type: 'text'
		}
		];	

		$scope.searchWO = [
			'wor',
			'date',
			'client.company.entity.name',
			'client.entity.fullName',
			'siteAddress.city.description'
		];

		$scope.selectTab = function (role) {
			$scope.selectedTab = role.description;
			
			$scope.pending = 0
			$scope.completed = 0
			$scope.PaymentRun = 0
			$scope.paid = 0

			$scope.filter()

			if (role.description == "Pending") {				
				$scope.pending = 1
			} 
			if (role.description == "Completed") {
				$scope.completed = 1
			}			
			if (role.description == "Payment Run") {
				$scope.PaymentRun = 1
			}		
			if (role.description == "Paid") {
				$scope.paid = 1
			}
		};	
		
		$scope.filter = function () {
			if ($rootScope.userData.role._id == 1) {
				$scope.filterPending = {
					'status._id': 1
				}
				$scope.filterCompleted = {
					"statusTech._id": {
						"$not": { "$in": [1, 2] }
					},
					'status._id': 3
				}
				$scope.filterPayment = {
					'statusTech._id': 1
				}
				$scope.filterPaid = {
					'statusTech._id': 2
				}
			} else {
				$scope.filterPending = {
					 'status._id': 1,
					 $or: [{ 'items.crewLeaderCol.techId': $rootScope.userData.techId }, { 'crewHeader.techId': $rootScope.userData.techId }] 
				}
				$scope.filterCompleted = {
					"statusTech._id": {
						"$not": { "$in": [1, 2] }
					},
					'status._id': 3,
					$or: [{ 'items.crewLeaderCol.techId': $rootScope.userData.techId }, { 'crewHeader.techId': $rootScope.userData.techId }] 
				}
				$scope.filterPayment  = {
					'statusTech._id': 1,
					 'items.crewLeaderCol.techId': $rootScope.userData.techId 
				}
				$scope.filterPaid = {
					'statusTech._id': 2,
					'items.crewLeaderCol.techId': $rootScope.userData.techId
				}
			}
		}
		$scope.selectTab($scope.roles[0]);
		$scope.filter();
	});
