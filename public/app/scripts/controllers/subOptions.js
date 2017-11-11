'use strict';

angular.module('MobileCRMApp')
	.controller('SubOptionsCtrl', function ($scope, data, toaster, $uibModalInstance, User, RoleOptions) {
	console.log(data.rOption)
	$scope.roleOption = angular.copy(data.rOption || []);
	$scope.roles = data.roles;
	$scope.options = data.options;
	$scope.roleOption.options = angular.copy($scope.roleOption.options || []);

	$scope.close = function(){
		$uibModalInstance.dismiss(data.rOption);
	};
	$scope.assign = function(){
		var result = {
			rOption: $scope.roleOption
		}
		console.log($scope.roleOption)
		$uibModalInstance.close(result)
	};
	$scope.removeOption = function(index){

			$scope.roleOption.options.splice(index, 1);
			toaster.success('The option was removed successfully');

	};
	$scope.addOption = function(){
		var roleOptions = new RoleOptions({
			roleId: Number($scope.roleOption.roleId),
			read: true,
			write: true,
			update: true, 
			delete: true,
			sort: 0
		});
		$scope.roleOption.options.push(roleOptions);
	};
	$scope.editOrder = function (rOption) {
		rOption.sort2 = rOption.sort;
		rOption.edition = true;
	}
	$scope.setOrder = function (rOption) {
		rOption.sort = rOption.sort2;
		rOption.edition = false;
	}
});
