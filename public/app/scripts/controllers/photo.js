'use strict';

angular.module('MobileCRMApp')
.controller('PhotoCtrl', function ($scope, data, $uibModalInstance, toaster) {
	$scope.photo = data.photo;
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
});
