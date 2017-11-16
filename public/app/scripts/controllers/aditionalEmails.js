'use strict';

angular.module('MobileCRMApp')
.controller('AditionalEmailsCtrl', function ($scope, $uibModalInstance, data, toaster) {
	$scope.emails = data.emails,length > 0 ? data.emails : [];

	$scope.add = function(){
		$scope.emails.push('');
	};
	$scope.remove = function(index){
		$scope.emails.splice(index, 1);
	};
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
	$scope.send = function(){
		if($scope.emails.length <= 0){
			toaster.error('', 'You need at least one email');
			return;
		}
		$uibModalInstance.close($scope.emails);
	};
});