'use strict';

angular.module('MobileCRMApp')
.controller('ChangePasswordCtrl', function ($scope, $rootScope, $uibModalInstance, toaster) {
	$scope.params = {};
	if($rootScope.userData && $rootScope.userData.account && $rootScope.userData.account.email){
		$scope.params.email = angular.copy($rootScope.userData.account.email);
	}
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
	$scope.send = function(){
		console.log($scope.params)
		if(!$scope.params.email){
			toaster.error('You need to confirm your email address');
			return;
		}
		if($scope.params.password != $scope.params.password1){
			toaster.error('Both passwords must be the same');
			return;
		}
		$uibModalInstance.close({ email: $scope.params.email, password: $scope.params.password });
	};
});
