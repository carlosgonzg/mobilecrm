'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('RoleOptionListCtrl', function ($scope, roles, options, RoleOptions) {
	$scope.roles = roles.data;
	$scope.options = options.data;
	var roleOptions = new RoleOptions();
	$scope.roleOptions = {};
	$scope.selectTab = function(role){
		$scope.selectedId = role._id.toString();
		$scope.selectedTab = role.description;
		roleOptions.filter({ roleId: role._id })
		.then(function(result){
			$scope.roleOptions[$scope.selectedId] = result.data || [];
		});
	};
	
	$scope.addOption = function(){
		var roleOptions = new RoleOptions({
			roleId: Number($scope.selectedId),
			read: true,
			write: true,
			update: true, 
			delete: true,
			sort: 0
		});
		$scope.roleOptions[$scope.selectedId].push(roleOptions);
	};
	
	$scope.save = function(){
		var promises = [];
		for(var i = 0; i < $scope.roleOptions[$scope.selectedId].length; i++){
			promises.push($scope.roleOptions[$scope.selectedId].save());
		}
		q.all(promises)
		.then(function(){
			toaster.success('The role was updated successfully');
		})
		.catch(function(){
			toaster.error(error.message);
		});
	};
	$scope.selectTab(angular.copy($scope.roles[0]));
});
