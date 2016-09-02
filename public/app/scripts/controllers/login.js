'use strict';

angular.module('MobileCRMApp')
.controller('LoginCtrl', function ($scope, $rootScope, $location, User) {
	$rootScope.userData = new User();
	$scope.login = function () {
		$rootScope.userData.login()
		.then(function (data) {
			if($rootScope.userData.role._id == 1){
				$location.path('userList');
			}
			else {
				$location.path('orderServiceList');
			}
		}, function (err) {});
	};
	$scope.forgetPassword = function(){
		$rootScope.userData.forgetPassword();
	};
});
