'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('ItemCompanyListCtrl', function ($scope, $location, ItemCompany) {
		$scope.wsCompanies = ItemCompany;
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
			$location.path('itemCompany');
		};
	});
