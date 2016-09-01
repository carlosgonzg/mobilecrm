'use strict';

angular.module('MobileCRMApp')
.controller('SessionCtrl', function ($scope, $rootScope, $location, $window, User) {
	if (!$window.sessionStorage.token) {
		$rootScope.isAuthenticated = false;
		$rootScope.userData = {};
	} else {
		$rootScope.isAuthenticated = true;
		$rootScope.userData = JSON.parse($window.sessionStorage.user);
		var user = new User();
		user.getActualUser()
		.then(function (obj) {
			$rootScope.userData = obj;
			$window.sessionStorage.user = JSON.stringify(obj);
		}, function (error) {
			$location.path('/login');
		});
	}

	$rootScope.$on("$routeChangeStart", function () {
		if (!$window.sessionStorage.token && ($location.path() != '/login' && $location.path() != '/register' && $location.path().substr(0, 15) != "/changepassword" && $location.path().substr(0, 14) != "/confirm/email")) {
			$location.path('/login');
		}
	});
});
