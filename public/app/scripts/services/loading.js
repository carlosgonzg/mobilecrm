'use strict';

angular.module('MobileCRMApp')
.factory('Loading', function ($timeout, $rootScope, dialogs) {
	var Loading = function(){
		this.dialog = null;
	}

	Loading.show = function(){
		this.dialog = dialogs.wait('Wait', 'Please wait. Loading...', 50);
	};
	Loading.hide = function(){
		$timeout(function(){
			$rootScope.$broadcast('dialogs.wait.complete');
		}, 200);
	};
	return Loading;
});
