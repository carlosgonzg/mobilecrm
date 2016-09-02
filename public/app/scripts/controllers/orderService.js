'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('OrderServiceCtrl', function ($scope, $rootScope, $location, toaster, User, orderService, items, Item) {
	$scope.orderService = orderService;
	$scope.items = items.data;
	$scope.readOnly = $rootScope.userData.role._id != 1;
	$scope.listStatus = [{
		_id: 1,
		description: 'Pending'
	},{
		_id: 2,
		description: 'In Progress'
	},{
		_id: 3,
		description: 'Done'
	},{
		_id: 4,
		description: 'Paid'
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
		$scope.orderService.items.push(new Item())
	};
	$scope.removeItem = function (index) {
		$scope.orderService.items.splice(index, 1);
	};
	$scope.setItem = function(item, index) {
		$scope.orderService.items[index] = new Item(item);
	};

	$scope.save = function () {
		delete $scope.orderService.client.account.password;
		$scope.orderService.save()
		.then(function (data) {
			toaster.success('The Order Service was saved successfully');
			$location.path('orderServiceList')
		},
			function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};

});
