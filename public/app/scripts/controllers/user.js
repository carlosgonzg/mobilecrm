'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('UserCtrl', function ($scope, $rootScope, $window, $location, toaster, dialogs, user, companies, roles, $timeout, Branch) {
	$scope.user = user;
	$scope.roles = roles.data || [];
	$scope.companies = companies.data || [];
	$scope.branches = [];
	if($rootScope.userData.role._id != 1 && user._id != $rootScope.userData._id){
		$location.path('/noaccess');
	}

	$scope.getBranches = function(company){
		$scope.branches = [];
		new Branch().filter({ 'company._id': company._id})
		.then(function(res){
			$scope.branches = res.data;
		});
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

	$scope.delete = function(){
		var dlg = dialogs.confirm('Warning','Are you sure you want to remove?');
		dlg.result.then(function(btn){
			$scope.user.remove()
			.then(function(){
				toaster.success('The user was removed successfully');
				$location.path('/userList')
			});
		});
	};
	if($scope.user.company){
		$scope.getBranches($scope.user.company)
	}
});
