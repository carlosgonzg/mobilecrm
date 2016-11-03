'use strict';

angular.module('MobileCRMApp')
.controller('CommentCtrl', function ($scope, data, $uibModalInstance, toaster) {
	$scope.comment = data.comment;
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
});
