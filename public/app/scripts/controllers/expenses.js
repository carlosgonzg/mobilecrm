'use strict';

angular.module('MobileCRMApp')
	.controller('ExpensesCtrl', function ($scope, data, $uibModalInstance, User) {
		console.log(data)
	$scope.expenses = angular.copy(data.expenses || []);
	$scope.expensesComplete = angular.copy(data.expensesComplete || false);
	$scope.technician = angular.copy(data.technician)

	$scope.technicians = [];

	new User().filter({"role._id":4})
			.then(function (result) {
				$scope.technicians = result.data;
			})

	$scope.close = function(){
		$uibModalInstance.dismiss(data.expenses);
	};
	$scope.assign = function(){
		var result = {
			expenses: $scope.expenses,
			expensesComplete: $scope.expensesComplete,
			technician: $scope.technician
		}

		$uibModalInstance.close(result)
	};
	$scope.add = function(){
		$scope.expenses.push({
			description: '',
			price: 0
		});
	};
	$scope.remove = function(index){
		$scope.expenses.splice(index, 1);

		if ($scope.expenses.length === 0) {
			$scope.expensesComplete = false;
		}
	};
});
