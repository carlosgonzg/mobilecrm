'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('CompanyCtrl', function ($scope, $rootScope, $location, toaster, company) {
	$scope.company = company;
	if($rootScope.userData.role._id != 1){
		$location.path('/noaccess');
	}
	$scope.addAddress = function () {
		$scope.company.addresses.push({});
	};
	$scope.removeAddress = function (index) {
		$scope.company.addresses.splice(index, 1);
	};
	$scope.addPhone = function () {
		$scope.company.phones.push({});
	};
	$scope.removePhone = function (index) {
		$scope.company.phones.splice(index, 1);
	};
	
	$scope.save = function () {
		$scope.company.save()
		.then(function (data) {
			toaster.success('The company was registered successfully');
			$location.path('companyList')
		},
			function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};

});
