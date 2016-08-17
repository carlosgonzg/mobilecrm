'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('UserCtrl', function ($scope, $window, $location, toaster, Country, Province, City, user, roles, countries) {
	$scope.user = user;
	$scope.roles = roles.data || [];
	$scope.countries = [];
	$scope.countries = countries.data || [];
	$scope.provinces = [];
	$scope.cities = [];

	$scope.addAddress = function () {
		$scope.user.addresses.push({
			phones : []
		});
		$scope.countries.push();
		$scope.provinces.push();
		$scope.cities.push();
	};
	$scope.removeAddress = function (index) {
		$scope.user.addresses.splice(index, 1);
		$scope.countries.splice(index, 1);
		$scope.provinces.splice(index, 1);
		$scope.cities.splice(index, 1);
	};
	$scope.searchProvince = function (country, index) {
		$scope.provinces[index] = [];
		country.getProvinces()
		.then(function (provinces) {
			$scope.provinces[index] = provinces;
		}, function (error) {
			console.log(error);
			$scope.provinces[index] = [];
		});
	};
	$scope.searchCity = function (province, index) {
		$scope.cities[index] = [];
		province.getCities()
		.then(function (cities) {
			$scope.cities[index] = cities;
		}, function (error) {
			console.log(error);
			$scope.cities[index] = [];
		});
	};
	$scope.save = function () {
		if (!$scope.user._id) {
			$scope.user.account.password = angular.copy($scope.user.account.email);
			$scope.user.register()
			.then(function (data) {
				toaster.success('The user was registered successfully');
				$location.path('userList')
			},
				function (error) {
				console.log(error);
				toaster.error(error.message);
			});
		} else {
			$scope.user.update()
			.then(function (data) {
				toaster.success('The user was updated successfully');
				$location.path('userList');
			},
				function (error) {
				console.log(error);
				toaster.error(error.message);
			});
		}
	};

	if ($scope.user.id) {
		for (var i = 0; i < $scope.user.addresses.length; i++) {
			$scope.countries.push();
			$scope.provinces.push();
			$scope.cities.push();
			$scope.user.addresses[i].country = new Country($scope.user.addresses[i].city.province.country);
			$scope.user.addresses[i].province = new Province($scope.user.addresses[i].city.province);
			$scope.user.addresses[i].city = new City($scope.user.addresses[i].city);
			$scope.searchProvince($scope.user.addresses[i].country, i);
			$scope.searchCity($scope.user.addresses[i].province, i);
		}

	}
});
