'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('OrderServiceCtrl', function ($scope, $rootScope, $location, toaster, User, orderService, items) {
	$scope.orderService = orderService;
	$scope.items = items;
	$scope.readOnly = $rootScope.userData.role._id != 1;
	
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
	
	$scope.addAddress = function () {
		$scope.orderService.addresses.push({});
	};
	$scope.removeAddress = function (index) {
		$scope.orderService.addresses.splice(index, 1);
	};
	$scope.addPhone = function () {
		$scope.orderService.phones.push({});
	};
	$scope.removePhone = function (index) {
		$scope.orderService.phones.splice(index, 1);
	};
	
	$scope.save = function () {
		if (!$scope.orderService._id) {
			$scope.orderService.insert()
			.then(function (data) {
				toaster.success('The Order Service was registered successfully');
				$location.path('userList')
			},
				function (error) {
				console.log(error);
				toaster.error(error.message);
			});
		} else {
			$scope.orderService.update()
			.then(function (data) {
				toaster.success('The Order Service was updated successfully');
				$location.path('userList');
			},
				function (error) {
				console.log(error);
				toaster.error(error.message);
			});
		}
	};

});
