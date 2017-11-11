'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('RoleOptionListCtrl', function ($scope, $q, roles, options, RoleOptions, toaster, dialogs, Role) {
	$scope.roles = roles.data;
	$scope.options = options.data;
	console.log($scope.options)
	var roleOptions = new RoleOptions();
	$scope.roleOptions = {};
	
	$scope.selectTab = function(role){
		console.log(role)
		$scope.selectedId = role._id.toString();
		$scope.selectedTab = role.description;
		if(!$scope.roleOptions[$scope.selectedId]){
			$scope.roleOptions[$scope.selectedId] = [];
		}
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
	$scope.removeOption = function(index, rOption){
		console.log(rOption)
		rOption
		.remove()
		.then(function(data){
			new Role().filter({_id: rOption.roleId})
				.then(function(result) {
					console.log(result)
					$scope.selectTab(result.data[0])	
				})
			// $scope.roleOptions[$scope.selectedId].splice(index, 1);
			// toaster.success('The option was removed successfully');
		})
		.catch(function(error){
			toaster.error(error.message);
		});
	};
	$scope.editRoles = function () {
		var dialog = dialogs.create('views/roleList.html', 'RoleListCtrl', {});
		dialog.result
		.then(function (res) {

		});
	};
	$scope.save = function(){
		var promises = [];
		for(var i = 0; i < $scope.roleOptions[$scope.selectedId].length; i++){
			console.log($scope.roleOptions[$scope.selectedId][i]);
			
			promises.push($scope.roleOptions[$scope.selectedId][i].save());
		}
		
		$q.all(promises)
		.then(function(){
			toaster.success('The role was updated successfully');
		})
		.catch(function(error){
			toaster.error(error.message);
		});
	};
	$scope.editOrder = function (rOption) {
		rOption.sort2 = rOption.sort;
		rOption.edition = true;
	}
	$scope.setOrder = function (rOption) {
		rOption.sort = rOption.sort2;
		rOption.edition = false;
	}
	$scope.showOptions = function (rOption) {

			var dialog = dialogs.create('views/subOptions.html', 'SubOptionsCtrl', {
				rOption: rOption,
				roles: $scope.roles,
				options: $scope.options
			});
			dialog.result
			.then(function (res) {
				rOption.options = res.rOption.options;
			});
	};
	$scope.selectTab(angular.copy($scope.roles[0]));
});
