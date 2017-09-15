'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('UserListCtrl', function ($scope, $location, User, RoleOptions, roles) {
	$scope.wsUser = User;
	$scope.user = new User();
	$scope.roles = roles.data;

	$scope.fields = [{
			title : 'Company',
			name : 'company.entity.name',
			type : 'text'
		},{
			title : 'Branch',
			name : 'branch.name',
			type : 'text'
		},{
			title : 'Regional Manager',
			name : 'isRegionalManager',
			type : 'checkbox'
		},{
			title : 'Name',
			name : 'entity.fullName',
			type : 'text'
		}, {
			title : 'Email',
			name : 'account.email',
			type : 'text'
		}, {
			title : 'Role',
			name : 'role.description',
			type : 'text'
		}
	];

	$scope.search = [
		'_id',
		'entity',
		'entity.fullName',
		'account.email',
		'role.description',
		'company.entity.name',
		'branch.name',
		'isRegionalManager'
	];

	$scope.filter1 = {
		'role._id':1
	}

	$scope.filter2 = {
		'role._id':3
	}

	$scope.filter3 = {
		'role._id':4
	}

	$scope.filter4 = {
		'role._id':5
	}

	$scope.createNew = function () {
		$location.path('user');
	};

	$scope.selectTab = function(role){
		$scope.selectedId = role._id.toString();
		$scope.selectedTab = role.description;

		// if(!$scope.roleOptions[$scope.selectedId]){
		// 	$scope.roleOptions[$scope.selectedId] = [];
		// }
		// roleOptions.filter({ roleId: role._id })
		// .then(function(result){
		// 	$scope.roleOptions[$scope.selectedId] = result.data || [];
		// });
	};

	$scope.selectTab(angular.copy($scope.roles[0]));
});
