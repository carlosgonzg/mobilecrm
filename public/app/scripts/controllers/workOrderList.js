'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('WorkOrderListCtrl', function ($scope, $rootScope, $location, WorkOrder) {
	$scope.workOrder = WorkOrder;

	$scope.fields = [{
			title : 'Company',
			name : 'client.company.entity.name',
			type : 'text'
		},{
			title : 'Branch',
			name : 'client.branch.name',
			type : 'text'
		},{
			title : 'Created Date',
			name : 'createdDate',
			type : 'date'
		}, {
			title : 'Invoice #',
			name : 'invoiceNumber',
			type : 'text'
		}, {
			title : 'WOR/Work Order #',
			name : 'wor',
			type : 'text'
		}, {
			title : 'Customer',
			name : 'client.entity.fullName',
			type : 'text'
		}, {
			title : 'Status',
			name : 'status.description',
			type : 'text'
		}, {
			title : 'Total Amount',
			name : 'total',
			type : 'currency'
		}
	];

	$scope.search = [
		'_id',
		'createdDate',
		'invoiceNumber',
		'wor',
		'client.branch',
		'client.company',
		'client.entity',
		'client.entity.fullName',
		'status.description',
		'total'
	];
	$scope.filterDate = 'createdDate';

  $scope.excelFields = [{
      title : 'Created Date',
      name : 'createdDate',
      type : 'date'
    }, {
      title : 'WOR/Work Order #',
      name : 'wor',
      type : 'text'
    }, {
      title : 'Invoice #',
      name : 'invoiceNumber',
      type : 'text'
    }, {
      title : 'Customer',
      name : 'client.entity.fullName',
      type : 'text'
    }, {
      title : 'Status',
      name : 'status.description',
      type : 'text'
    }, {
      title : 'Total Amount',
      name : 'total',
      type : 'currency'
    }
  ];

	$scope.filter = $rootScope.userData.role._id == 1 ? { } : {'client._id': $rootScope.userData._id };

	$scope.createNew = function () {
		$location.path('workOrder');
	};
});
