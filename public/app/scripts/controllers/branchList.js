'use strict';

angular.module('MobileCRMApp')
.controller('BranchListCtrl', function ($scope, $location, Branch) {
	$scope.wsBranches = Branch;
	$scope.fields = [
		{
			title: 'Company', 
			name: 'company.entity.name', 
			type: 'text'
		},
		{
			title: 'Name', 
			name: 'name', 
			type: 'text'
		},
		{
			title: 'Operations Manager', 
			name: 'operationsManager', 
			type: 'text'
		},
		{
			title: 'Office Coordinator', 
			name: 'officeCoordinator', 
			type: 'text'
		},
		{
			title: 'Branch Manager', 
			name: 'branchManager', 
			type: 'text'
		},
		{
			title: 'Office Manager', 
			name: 'officeManager', 
			type: 'text'
		},
		{
			title: 'Dispatcher', 
			name: 'dispatcher', 
			type: 'text'
		}
	];
	$scope.search = [
		'_id',
		'company.entity.name',
		'name',
		'operationsManager',
		'officeCoordinator',
		'branchManager',
		'officeManager',
		'dispatcher'
	];

	$scope.createNew = function () {
		$location.path('branch');
	};
});
