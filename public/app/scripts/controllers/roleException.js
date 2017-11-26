'use strict';

angular.module('MobileCRMApp')
.controller('RoleExceptionCtrl', function ($scope, $uibModalInstance, data, toaster) {
	$scope.companyExceptions = data.rOption.companyExceptions ? data.rOption.companyExceptions : [];
	$scope.userExceptions = data.rOption.userExceptions ? data.rOption.userExceptions : [];
	$scope.companyList = data.companies;
	$scope.userList = data.users;

	$scope.add = function(exceptions){
		exceptions.push({});
	};
	$scope.remove = function(exceptions, index){
		exceptions.splice(index, 1);
	};
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
	$scope.assign = function(companyExceptions, userExceptions){
		var result = {
			companyExceptions: companyExceptions,
			userExceptions: userExceptions
		}
		$uibModalInstance.close(result);
	};
	$scope.selectTab = function(option){
		$scope.selectedTab = option;
	};
	$scope.selectTab(1);

});