angular.module('MobileCRMApp')
.controller('ForgetPasswordCtrl', function ($scope, $uibModalInstance) {
	$scope.email = '';

	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
	$scope.send = function(){
		$uibModalInstance.close($scope.email);
	};
});