'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */

angular.module('MobileCRMApp')
	.controller('itemCompanyCtrl', function ($scope, $window, $location, toaster, dialogs, companies, Item) {
		$scope.companies = companies
		$scope.selectAll = true;

		new Item().filter({})
			.then(function (result) {
				$scope.item = result.data
				var itemcount = 0;

				for (let index = 0; index < $scope.item.length; index++) {
					var item = $scope.item[index]
					if (item.companies == undefined) {
						$scope.selectAll = true
						return
					}
					for (let row = 0; row < item.companies.length; row++) {
						if (item.companies[row]._id == $scope.companies._id) {
							itemcount += 1
						}
					}
				}
				if (itemcount == $scope.item.length) {
					$scope.selectAll = false
				} else {
					$scope.selectAll = true
				}
			})

		$scope.save = function () {
			for (let index = 0; index < $scope.item.length; index++) {
				$scope.itemSave = $scope.item[index]
				$scope.itemSave.save()
			}
			toaster.success('The Items was added successfully');
			$location.path('itemCompanyList')
		};

		$scope.checkOption = function (companies) {
			if (companies) {
				for (let row = 0; row < companies.length; row++) {
					const element = companies[row];
					if (element._id == $scope.companies._id) {
						return true
					}
				}
			}
			return false
		}

		$scope.addOption = function (item) {
			if (item.companies == undefined) {
				item.companies = []
				item.companies.push({ "_id": $scope.companies._id })
				return
			}
			for (let index = 0; index < item.companies.length; index++) {
				if (item.companies._id == $scope.companies._id) {
					item.companies.splice(index, 1);
				}
			}

			item.companies.push({
				"_id": $scope.companies._id
			}, )
		}

		$scope.removeOption = function (item) {
			for (let index = 0; index < item.companies.length; index++) {
				if (item.companies[index]._id == $scope.companies._id) {
					item.companies.splice(index, 1);
				}
			}
		}

		$scope.addAll = function () {
			$scope.waiting = true;
			for (let index = 0; index < $scope.item.length; index++) {
				var item = $scope.item[index]
				if (item.companies == undefined) {
					item.companies = []
					item.companies.push({ "_id": $scope.companies._id })
				}
				for (let row = 0; row < item.companies.length; row++) {
					if (item.companies[row]._id == $scope.companies._id) {
						item.companies.splice(row, 1);
					}
				}
				item.companies.push({
					"_id": $scope.companies._id
				})
			}
			$scope.selectAll = false
			$scope.waiting = false
		}

		$scope.RemoveAll = function () {
			for (let index = 0; index < $scope.item.length; index++) {
				var item = $scope.item[index]
				for (let row = 0; row < item.companies.length; row++) {
					if (item.companies[row]._id == $scope.companies._id) {
						item.companies.splice(row, 1);
					}
				}
			}
			$scope.selectAll = true
		}

	});
