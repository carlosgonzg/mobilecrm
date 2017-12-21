'use strict';

angular.module('MobileCRMApp')
.controller('HistoryModalCtrl', function ($scope, $rootScope, $uibModalInstance, $location, data, DeliveryOrder, ServiceOrder, WorkOrder) {
	
	$scope.workOrderList = [];
	$scope.serviceOrderList = [];

	$scope.wsFieldsSO = [{
		label: 'Service Order #',
		field: 'sor',
		type: 'text',
		show: true
	}, {
		label: 'Invoice #',
		field: 'invoiceNumber',
		type: 'text',
		show: true
	}, {
		label: 'Created Date',
		field: 'createdDate',
		type: 'date',
		show: true
	}, {
		label: 'Completed Date',
		field: 'originalShipDate',
		type: 'date',
		show: true
	}, {
		label: 'Company',
		field: 'client.company.entity.name',
		type: 'text',
		show: true
	}, {
		label: 'Branch',
		field: 'client.branch.name',
		type: 'text',
		show: true
	}, {
		label: 'Customer',
		field: 'client.entity.fullName',
		type: 'text',
		show: true
	}, {
		label: 'Status',
		field: 'status.description',
		type: 'text',
		show: true
	}, {
		label: 'Total Amount',
		field: 'total',
		type: 'currency',
		show: true
	}
	];

	$scope.wsFieldsWO = [{
		label: 'Work Order #',
		field: 'wor',
		type: 'text',
		show: true
	}, {
		label: 'Invoice #',
		field: 'invoiceNumber',
		type: 'text',
		show: true
	}, {
		label: 'Created Date',
		field: 'createdDate',
		type: 'date',
		show: true
	}, {
		label: 'Serial #',
		field: 'unitno',
		type: 'text',
		show: true
	}, {
		label: 'Company',
		field: 'client.company.entity.name',
		type: 'text',
		show: true
	}, {
		label: 'Branch',
		field: 'client.branch.name',
		type: 'text',
		show: true
	}, {
		label: 'Customer',
		field: 'client.entity.fullName',
		type: 'text',
		show: true
	}, {
		label: 'Status',
		field: 'status.description',
		type: 'text',
		show: true
	}, {
		label: 'Total Amount',
		field: 'total',
		type: 'currency',
		show: true
	}
	];

	if (data.unitno) {
		new WorkOrder().filter({'unitno': data.unitno, '_id': {$ne:data._id}})
		.then(function(result) {
			$scope.workOrderList = result.data;
		});

		new ServiceOrder().filter({'unitno': data.unitno, '_id': {$ne:data._id}})
		.then(function(result) {
			$scope.serviceOrderList = result.data;
		});
		
	}

	$scope.close = function(){
		$uibModalInstance.dismiss();
	};

	$scope.getData = function (entity, field) {
		var data = angular.copy(entity);

		if (typeof field == 'function') {
			data = field(data);
		} else {
			var properties = field.toString().split('.');
			for (var i = 0; i < properties.length; i++) {
				if(data){
					data = data[properties[i]];
				}
				else {
					data = '';
					break;
				}
			}
		}
		return data;
	};

	$scope.goto = function (type, _id) {
		window.open('/#/' + type + '/' + _id, '_blank');
	}
});
