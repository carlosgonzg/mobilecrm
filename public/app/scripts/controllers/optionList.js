'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('OptionListCtrl', function ($scope, Option) {
	$scope.wsOption = Option;
	$scope.fields = [
		{title: 'Description', name: 'description', required: true, type: 'text'},
		{title: 'URL', name: 'url', required: true, type: 'text'},
		{title: 'Icon', name: 'icon', required: false, type: 'text'},
	];
});
