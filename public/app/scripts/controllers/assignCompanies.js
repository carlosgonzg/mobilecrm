'use strict';

angular.module('MobileCRMApp')
.controller('AssignCompaniesCtrl', function ($scope, $rootScope, $uibModalInstance, data) {
	$scope.companyList = data.companyList || [];
	$scope.companies = data.companies || [];
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
	$scope.send = function(){
		$uibModalInstance.close({ companies: $scope.companies });
	};
	$scope.remove = function(index){
		$scope.companies.splice(index, 1);
	};
	$scope.add = function(index){
		$scope.companies.push({ _id: -1 });
	};
});
