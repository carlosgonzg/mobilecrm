'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */

angular.module('MobileCRMApp')
	.controller('paymentRunCtrl', function ($scope, $location, toaster, ServiceOrder) {
		console.log(ServiceOrder)

		$scope.ServiceOrder = ServiceOrder

		$scope.getTotal = function () {
			var total = 0;
			for (var row = 0; row < $scope.ServiceOrder.items.length; row++) {
				if ($scope.ServiceOrder.items[row].crewLeaderCol != undefined) {
					total += $scope.ServiceOrder.items[row].crewLeaderCol.price;
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
			$scope.ServiceOrder.statusTech = statusTech

			$scope.ServiceOrder.save()
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

