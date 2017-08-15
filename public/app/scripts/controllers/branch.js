'use strict';

angular.module('MobileCRMApp')
.controller('BranchCtrl', function ($scope, $rootScope, $location, toaster, branch, companies) {
	$scope.companies = companies.data;
	$scope.branch = branch;
	$scope.branch.custServiceCoordinators = $scope.branch.custServiceCoordinators || [];

	if($rootScope.userData.role._id != 1){
		$location.path('/noaccess');
	}
	$scope.addAddress = function () {
		$scope.branch.addresses.push({});
	};
	$scope.removeAddress = function (index) {
		$scope.branch.addresses.splice(index, 1);
	};
	$scope.addPhone = function () {
		$scope.branch.phones.push({});
	};
	$scope.removePhone = function (index) {
		$scope.branch.phones.splice(index, 1);
	};

	$scope.add = function(){
		$scope.branch.custServiceCoordinators.push({
			name: ''
		});
	};

	$scope.createCSCoordinatorString = function () {
		$scope.branch.CSCoordinatorString = null;
		if ($scope.branch.custServiceCoordinators.length>0) {
			for (var i=0; i<$scope.branch.custServiceCoordinators.length;i++) {
				if (i>0) {
					$scope.branch.CSCoordinatorString = $scope.branch.CSCoordinatorString + ", " + $scope.branch.custServiceCoordinators[i].name;
				} else {
					$scope.branch.CSCoordinatorString = $scope.branch.custServiceCoordinators[i].name;
				}
				console.log(i)

				if (i === $scope.branch.custServiceCoordinators.length-1) {
					$scope.save();
				}
				
			} 
		} else {
			$scope.save();
		}
	}

	$scope.remove = function(index){
		$scope.branch.custServiceCoordinators.splice(index, 1);
	};
	
	$scope.save = function () {

		$scope.branch.save()
		.then(function (data) {
			toaster.success('The branch was registered successfully');
			$location.path('branchList')
		},
			function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};

	if (!$scope.branch.custServiceCoordinators.length > 0){
		$scope.add();
	}

});
