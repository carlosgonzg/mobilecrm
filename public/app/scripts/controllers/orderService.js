'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('OrderServiceCtrl', function ($scope, $rootScope, $location, toaster, User, orderService, items, Item, dialogs, $q) {
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
		description: 'Completed'
	},{
		_id: 4,
		description: 'Paid'
	},{
		_id: 5,
		description: 'Cancelled'
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
		}, {
			field : 'company.entity.name',
			label : 'Company',
			type : 'text',
			show: true
		}, {
			field : 'branch.name',
			label : 'Branch',
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

	$scope.uploadFiles = function(files){
		$scope.files = angular.copy(files)
		function getBase64(file) {
			var d = $q.defer();
			var reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = function () {
				d.resolve(reader.result);
			};
			reader.onerror = function (error) {
				d.reject(error);
			};
			return d.promise;
		}
		var promises = [];
		for(var i = 0; i < files.length; i++){
			promises.push(getBase64(files[i]))
		}
		$q.all(promises)
		.then(function(urls){
			$scope.orderService.photos = $scope.orderService.photos || [];
			$scope.orderService.photos = $scope.orderService.photos.concat(urls)
		})
	}

	$scope.showPicture = function(index){
		$scope.orderService.showPicture(index);
	}

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

	$scope.delete = function(){
		var dlg = dialogs.confirm('Warning','Are you sure you want to delete?');
		dlg.result.then(function(btn){
			$scope.orderService.remove()
			.then(function(){
				toaster.success('The service order was deleted successfully');
				$location.path('/orderServiceList')
			});
		});
	};

	$scope.export = function(){
		$scope.orderService.getInvoice();
	};

	$scope.send = function(){
		$scope.orderService.sendInvoice();
	};
});
