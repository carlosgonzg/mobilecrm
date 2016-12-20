'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ItemCollectionListCtrl', function ($scope, $location, ItemCollection) {
	$scope.itemCollection = ItemCollection;

	$scope.fields = [{
			title : 'Description',
			name : 'description',
			type : 'text'
		},{
			title : 'Created Date',
			name : 'createdDate',
			type : 'date'
		},{
			title : 'Total',
			name : 'total',
			type : 'currency'
		}
	];

	$scope.search = [
		'_id',
		'createdDate',
		'description',
		'total'
	];
	$scope.filterDate = 'createdDate';

	$scope.excelFields = [{
			title : 'Description',
			name : 'description',
			type : 'text'
		},{
			title : 'Created Date',
			name : 'createdDate',
			type : 'date'
		},{
			title : 'Total',
			name : 'total',
			type : 'currency'
		}
	];

	$scope.createNew = function () {
		$location.path('itemCollection');
	};
});
