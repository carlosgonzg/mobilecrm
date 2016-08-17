'use strict';

angular.module('MobileCRMApp')
.factory('authInterceptor', function ($rootScope, $q, $window, $location) {
	return {
		request : function (config) {
			config.headers = config.headers || {};
			if ($window.sessionStorage.token) {
				config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
			}
			return config;
		},
		responseError : function (rejection) {
			if (rejection.status === 401) {
				// if not authorized access
				$location.path('/login');
			}
			return $q.reject(rejection);
		}
	};
})
.config(function ($httpProvider) {
	$httpProvider.interceptors.push('authInterceptor');
});
