'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('CompanyListCtrl', function ($scope, $location, Company) {
	$scope.wsCompanies = Company;
	$scope.fields = [
		{
			title: 'Name', 
			name: 'entity.name', 
			type: 'text'
		},
		{
			title: 'Order',
			name: 'order',
			type: 'text'
		}
	];
	$scope.search = [
		'_id',
		'entity.name',
		'entity.url',
		'order'
	];

	$scope.sortList = ['order']

	$scope.createNew = function () {
		$location.path('company');
	};
});
