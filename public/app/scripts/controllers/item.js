'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */

angular.module('MobileCRMApp')
	.controller('ItemCtrl', function ($scope, item, companies, $location, $q, toaster, dialogs) {
		$scope.item = item;
		$scope.waiting = false;

		$scope.list = [
			{ item: 'Material' },
			{ item: 'Labor' },
			{ item: 'Service' },
			{ item: 'By Default'}
		]

		$scope.save = function () {

			if ($scope.item.code) {
				$scope.waiting = true;
				$scope.item.save()
					.then(function () {
						toaster.success('The items was saved successfully');
						$location.path('itemList');
						$scope.waiting = false;
					})
					.catch(function (error) {
						toaster.error(error.message);
						$scope.waiting = false;
					});

			}

			else {
				toaster.error("Code can't be empty");
			}
		};

		$scope.remove = function () {
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to remove?');
			dlg.result.then(function (btn) {
				$scope.item.remove()
					.then(function () {
						toaster.success('The item was removed successfully');
						$location.path('/itemList');
					})
					.catch(function (error) {
						toaster.error(error.message);
					});
			});
		};

		$scope.assignCompanies = function () {
			var itemCompanies = $scope.item.companies || [];
			var dialog = dialogs.create('views/assignCompanies.html', 'AssignCompaniesCtrl', { companyList: companies.data, companies: itemCompanies });
			dialog.result.then(function (res) {
				$scope.item.companies = res.companies;
			});
		};
	})