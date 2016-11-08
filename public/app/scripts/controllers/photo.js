'use strict';

angular.module('MobileCRMApp')
.controller('PhotoCtrl', function ($scope, data, $uibModalInstance, toaster) {
	$scope.photos = data.photos;
	$scope.index = data.index || 0;
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
	$scope.next = function(){
		$scope.index = $scope.index + 1 < data.photos.length ? $scope.index + 1 : 0;
	};
	$scope.previous = function(){
		$scope.index = $scope.index - 1 >= 0 ? $scope.index -1 : data.photos.length - 1;
	};
});
