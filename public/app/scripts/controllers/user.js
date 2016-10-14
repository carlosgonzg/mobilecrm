'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('UserCtrl', function ($scope, $rootScope, $window, $location, toaster, user, companies, roles, $timeout) {
	$scope.user = user;
	$scope.roles = roles.data || [];
	$scope.companies = companies.data || [];
	if($rootScope.userData.role._id != 1 && user._id != $rootScope.userData._id){
		$location.path('/noaccess');
	}
	$scope.addAddress = function () {
		$scope.user.addresses.push({});
	};
	$scope.removeAddress = function (index) {
		$scope.user.addresses.splice(index, 1);
	};
	$scope.addPhone = function () {
		$scope.user.phones.push({});
	};
	$scope.removePhone = function (index) {
		$scope.user.phones.splice(index, 1);
	};
	
	$scope.save = function () {
		if (!$scope.user._id) {
			$scope.user.account.password = angular.copy($scope.user.account.email);
			$scope.user.entity.fullName = $scope.user.entity.firstName + ' ' + $scope.user.entity.lastName;
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
				//$location.path('userList');
			},
				function (error) {
				console.log(error);
				toaster.error(error.message);
			});
		}
	};

});
