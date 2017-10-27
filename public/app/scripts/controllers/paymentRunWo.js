'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */

angular.module('MobileCRMApp')
	.controller('paymentRunWoCtrl', function ($scope, $location, toaster, WorkOrder) {
		console.log(WorkOrder)

		$scope.WorkOrder = WorkOrder

		$scope.getTotal = function () {
			var total = 0;
			for (var row = 0; row < $scope.WorkOrder.items.length; row++) {
				if ($scope.WorkOrder.items[row].crewLeaderCol != undefined) {
					total += $scope.WorkOrder.items[row].crewLeaderCol.price;
				}
			}
			return total
		}

		$scope.save = function () {
			$scope.waiting = true;

			var statusTech = []
			statusTech = {
				_id: 2,
				description: "Paid"
			}
			$scope.WorkOrder.statusTech = statusTech

			$scope.WorkOrder.save()
				.then(function (data) {
					toaster.success('The Invoice was saved successfully');
					$location.path('paymentRunList')
					$scope.waiting = false;
				},
				function (error) {
					toaster.error('The Invoice couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		}

	});

