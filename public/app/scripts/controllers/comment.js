'use strict';

angular.module('MobileCRMApp')
.controller('CommentCtrl', function ($scope, data, $uibModalInstance, toaster) {
	$scope.orderService = data.orderService;
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
});
