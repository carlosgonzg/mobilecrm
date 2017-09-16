'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ItemListCtrl', function ($scope, $rootScope, $location, Item) {
	$scope.item = Item;
	$scope.fields = [{
			title : 'Code',
			name : 'code',
			type : 'text'
		},{
			title : 'Description',
			name : 'description',
			type : 'text'
		},{
			title : 'Part',
			name : 'part',
			type : 'text'
		},{
			title : 'Unit of Measure',
			name : 'unitOfMeasure',
			type : 'text'
		}, {
			title : 'Price',
			name : 'price',
			type : 'currency'
		}
	];

	$scope.search = [
		'_id',
		'code',
		'description',
		'part',
		'unitOfMeasure',
		'price'
	];
	// $scope.filterDate = 'code';

  $scope.excelFields = [{
			title : 'Code',
			name : 'code',
			type : 'text'
		},{
			title : 'Description',
			name : 'description',
			type : 'text'
		},{
			title : 'Part',
			name : 'part',
			type : 'text'
		},{
			title : 'Unit of Measure',
			name : 'unitOfMeasure',
			type : 'text'
		}, {
			title : 'Price',
			name : 'price',
			type : 'currency'
		}
  ];

  $scope.sort = {
  		'code' : 1
  }

	$scope.filter = {};
	
	$scope.createNew = function () {
		$location.path('item');
	};
});
