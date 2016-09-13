'use strict';

angular.module('MobileCRMApp')
.controller('LoginCtrl', function ($scope, $rootScope, $location, User) {
	$rootScope.userData = new User();
	$scope.login = function () {
		$rootScope.userData.login()
		.then(function (data) {
			for(var i = 0; i < $rootScope.roleOptions.length; i++){
				if($rootScope.roleOptions[i].sort != 0){
					$location.path($rootScope.roleOptions[i].option.url);
					break;
				}
			}
		}, function (err) {});
	};
	$scope.forgetPassword = function(){
		$rootScope.userData.forgetPassword();
	};
});
