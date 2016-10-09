'use strict';

angular.module('MobileCRMApp')
.controller('AssignClientsCtrl', function ($scope, $rootScope, $uibModalInstance, data) {
	$scope.clientList = data.clientList || [];
	$scope.clients = data.clients || [];
	$scope.close = function(){
		$uibModalInstance.dismiss();
	};
	$scope.send = function(){
		$uibModalInstance.close({ clients: $scope.clients });
	};
	$scope.remove = function(index){
		$scope.clients.splice(index, 1);
	};
	$scope.add = function(index){
		$scope.clients.push({ _id: -1 });
	};
});
