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
			title: 'Branch', 
			name: 'name', 
			type: 'text'
		},
		{
			title: 'Operations Manager', 
			name: 'operationsManager.name', 
			type: 'text'
		},
		{
			title: 'Office Coordinator', 
			name: 'officeCoordinator.name', 
			type: 'text'
		},
		{
			title: 'Branch Manager', 
			name: 'branchManager.name', 
			type: 'text'
		},
		{
			title: 'Office Manager', 
			name: 'officeManager.name', 
			type: 'text'
		},
		{
			title: 'Dispatcher', 
			name: 'dispatcher.name', 
			type: 'text'
		},
		{
			title: 'Customer Service Coord.', 
			name: 'CSCoordinatorString', 
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
		'dispatcher',
		'CSCoordinatorString'
	];

	$scope.createNew = function () {
		$location.path('branch');
	};
});
