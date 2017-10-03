'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */

angular.module('MobileCRMApp')
	.controller('crewLeaderCtrl', function ($scope, $rootScope, $window, $location, toaster, dialogs, user, companies, roles, $timeout, Branch, item) {

		$scope.user = user;
		$scope.item = item.data
		$scope.crewleaderName = user.entity.fullName + " - " + user.category
		 $scope.table = false;

		$scope.newItem = {}

		$scope.addedItem = [{
			item: String,
			itemid: Number,
			price: null
		}
		]

		$scope.addedItem = []

		if (user.CrewCollection != undefined) {
			$scope.table = true
			$scope.addedItem = user.CrewCollection
		}

		$scope.add = function (obj) {
			if (obj !== 'undefined' || obj !== '') {

				for (var index = 0; index < $scope.addedItem.length; index++) {
					var element = $scope.addedItem[index].item;

					if (element.indexOf(obj.description) >= 0) {
						toaster.error('This item has already been added...');
						return;
					}
				}

				$scope.newItem = {
					item: obj.description,
					price: null,
					itemid: obj._id
				}

				$scope.addedItem.push($scope.newItem);
				$scope.table = true
				$scope.newItem = {};
			} else {
				toaster.error('Please enter an item');
			}
		}

		$scope.removeOption = function (obj) {
			var index = $scope.addedItem.indexOf(obj.description);
			$scope.addedItem.splice(index, 1);
		}

		$scope.save = function (obj) {
			if (obj.length == 0) { toaster.error('Please enter an item'); return }

			$scope.user.CrewCollection = $scope.addedItem

			$scope.user.update()
				.then(function (data) {
					toaster.success('The user was updated successfully');
					$location.path('crewLeaderList');
				},
				function (error) {
					toaster.error(error);
				});

		};

	});
