'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ItemListCtrl', function ($scope, Item) {
	$scope.wsItem = Item;
	$scope.fields = [
		{title: 'Code', name: 'code', required: true, type: 'number'},
		{title: 'Description', name: 'description', required: true, type: 'text'},
		{title: 'Part', name: 'part', required: false, type: 'number'},
		{title: 'Unit of Measure', name: 'unitOfMeasure', required: false, type: 'text'},
		{title: 'Price', name: 'price', required: false, type: 'number'}
	];
});
