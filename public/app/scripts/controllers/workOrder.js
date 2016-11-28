'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('WorkOrderCtrl', function ($scope, $rootScope, $location, toaster, User, workOrder, items, Item) {
	$scope.workOrder = workOrder;
	$scope.items = items.data;
	$scope.readOnly = $rootScope.userData.role._id != 1;
	if($rootScope.userData.role._id != 1){
		$scope.workOrder.client = new User($rootScope.userData);
	}
	$scope.listStatus = [{
		_id: 1,
		description: 'Pending'
	},{
		_id: 2,
		description: 'In Progress'
	},{
		_id: 3,
		description: 'Completed'
	},{
		_id: 4,
		description: 'Paid'
	},{
		_id: 5,
		description: 'Cancelled'
	},{
		_id: 6,
		description: 'Scheduled'
	}];

	$scope.wsClass = User;
	$scope.wsFields = [{
			field : 'entity.fullName',
			label : 'Name',
			type : 'text',
			show : true
		}, {
			field : 'account.email',
			label : 'Email',
			type : 'text',
			show: true
		}
	];
	
	$scope.addItem = function () {
		$scope.workOrder.items.push(new Item())
	};
	$scope.removeItem = function (index) {
		$scope.workOrder.items.splice(index, 1);
	};
	$scope.setItem = function(item, index) {
		$scope.workOrder.items[index] = new Item(item);
	};

	
	$scope.isDisabled = function(){
		return $rootScope.userData.role._id != 1 && $scope.workOrder.status._id == 3;
	};

	
	$scope.save = function () {
		delete $scope.workOrder.client.account.password;
		$scope.workOrder.save()
		.then(function (data) {
			toaster.success('The invoice was saved successfully');
			$location.path('workOrderList')
		},
			function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};
});
