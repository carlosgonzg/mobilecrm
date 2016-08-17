'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('RoleListCtrl', function ($scope, Role) {
	$scope.wsRole = Role;
	$scope.fields = [
		{title: 'Description', name: 'description', required: true, type: 'text'}
	];
});
