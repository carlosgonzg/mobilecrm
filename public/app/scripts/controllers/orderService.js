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
	$scope.items = [];
	$scope.readOnly = $rootScope.userData.role._id != 1;
	if($rootScope.userData.role._id != 1){
		$scope.orderService.client = new User($rootScope.userData);
	}
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

	$scope.clientChanged = function(client){
		$scope.items = [];
		for(var i = 0; i < items.data.length; i++){
			if(!items.data[i].clients){
				$scope.items.push(items.data[i]);
			}
			else {
				for(var j = 0; j < items.data[i].clients.length; j++){
					if(items.data[i].clients[j]._id == client._id){
						$scope.items.push(items.data[i]);
						break;
					}
				}
			}
		}
		console.log(items.data, $scope.items)
	};
	
	$scope.addItem = function () {
		$scope.orderService.items.push(new Item())
	};
	$scope.removeItem = function (index) {
		$scope.orderService.items.splice(index, 1);
	};
	$scope.setItem = function(item, index) {
		$scope.orderService.items[index] = new Item(item);
	};

	$scope.changed = function(field){
		if($scope.orderService._id && $rootScope.userData.role._id != 1){
			var isHere = false;
			$scope.orderService.fieldsChanged = $scope.orderService.fieldsChanged || [];
			for(var i = 0; i < $scope.orderService.fieldsChanged.length; i++){
				if($scope.orderService.fieldsChanged[i] == field){
					isHere = true;
					break;
				}
			}
			if(!isHere){
				$scope.orderService.fieldsChanged.push(field);
			}
		} 
	};
	$scope.isChanged = function(field){
		if($scope.orderService._id && $rootScope.userData.role._id == 1){
			var isHere = false;
			$scope.orderService.fieldsChanged = $scope.orderService.fieldsChanged || [];
			for(var i = 0; i < $scope.orderService.fieldsChanged.length; i++){
				if($scope.orderService.fieldsChanged[i] == field){
					isHere = true;
					break;
				}
			}
			return isHere ? 'changed' : '';
		}
		return '';
	};
	$scope.isDisabled = function(){
		return $rootScope.userData.role._id != 1 && $scope.orderService.status._id == 3;
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

	$scope.export = function(){
		$scope.orderService.getInvoice();
	};

	$scope.send = function(){
		$scope.orderService.sendInvoice();
	};
});
