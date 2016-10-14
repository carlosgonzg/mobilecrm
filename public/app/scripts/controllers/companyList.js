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
		}
	];
	$scope.search = [
		'_id',
		'entity.name',
		'entity.url'
	];

	$scope.createNew = function () {
		$location.path('company');
	};
});
