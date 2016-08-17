'use strict';

angular.module('MobileCRMApp')
.controller('LoginCtrl', function ($scope, $rootScope, $location, User) {
	$rootScope.userData = new User();
	$scope.login = function () {
		$rootScope.userData.login()
		.then(function (data) {
			$location.path('userList');
		}, function (err) {});
	};
});
