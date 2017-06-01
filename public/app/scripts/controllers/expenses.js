'use strict';

angular.module('MobileCRMApp')
.controller('ExpensesCtrl', function ($scope, data, $uibModalInstance) {
	$scope.expenses = angular.copy(data.expenses || []);

	$scope.close = function(){
		$uibModalInstance.dismiss(data.expenses);
	};
	$scope.assign = function(){
		$uibModalInstance.close($scope.expenses)
	};
	$scope.add = function(){
		$scope.expenses.push({
			description: '',
			price: 0
		});
	};
	$scope.remove = function(index){
		$scope.expenses.splice(index, 1);
	};
});
