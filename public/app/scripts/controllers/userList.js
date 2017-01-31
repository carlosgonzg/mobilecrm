'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('UserListCtrl', function ($scope, $location, User) {
	$scope.wsUser = User;

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

	$scope.createNew = function () {
		$location.path('user');
	};
});
