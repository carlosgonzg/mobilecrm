'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('UserListCtrl', function ($scope, $location, $window, users) {
	$scope.userList = users.data || [];
	$scope.goBack = function () {
		$window.history.back();
	};
	$scope.createNew = function () {
		$location.path('user');
	};
});
