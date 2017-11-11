'use strict';

angular.module('MobileCRMApp')
.controller('NavigationCtrl', function ($scope, $rootScope, $window, $location) {
	$scope.collapse = function (rOption) {
		rOption.collapsed = rOption.collapsed ? false : true;
	}
});
