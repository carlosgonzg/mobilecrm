'use strict';

angular.module('MobileCRMApp')
.controller('BranchCtrl', function ($scope, $rootScope, $location, toaster, branch, companies) {
	$scope.companies = companies.data;
	$scope.branch = branch
	if($rootScope.userData.role._id != 1){
		$location.path('/noaccess');
	}
	$scope.addAddress = function () {
		$scope.branch.addresses.push({});
	};
	$scope.removeAddress = function (index) {
		$scope.branch.addresses.splice(index, 1);
	};
	$scope.addPhone = function () {
		$scope.branch.phones.push({});
	};
	$scope.removePhone = function (index) {
		$scope.branch.phones.splice(index, 1);
	};
	
	$scope.save = function () {
		$scope.branch.save()
		.then(function (data) {
			toaster.success('The branch was registered successfully');
			$location.path('branchList')
		},
			function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};

});
