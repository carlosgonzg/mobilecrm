'use strict';

angular.module('MobileCRMApp')
.factory('Loading', function (Base, Item, $rootScope, $location, dialogs) {
	var Loading = function(){
		this.dialog = null;
	}

	Loading.show = function(){
		this.dialog = dialogs.wait('Wait', 'Please wait. Loading...', 50);
	};
	Loading.hide = function(){
		$rootScope.$broadcast('dialogs.wait.complete');
	};
	return Loading;
});
