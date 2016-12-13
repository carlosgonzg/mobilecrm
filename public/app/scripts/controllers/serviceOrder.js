'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ServiceOrderCtrl', function ($scope, $rootScope, $location, toaster, User, statusList, serviceOrder, items, Item, dialogs, $q) {
	$scope.serviceOrder = serviceOrder;
	$scope.items = [];
	$scope.readOnly = $rootScope.userData.role._id != 1;
	if($rootScope.userData.role._id != 1){
		$scope.serviceOrder.client = new User($rootScope.userData);
	}
	$scope.listStatus = statusList;

	$scope.wsClass = User;
	$scope.wsFilter = { 'role._id': { $ne: 1 }};
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

	$scope.addContact = function () {
		$scope.serviceOrder.contacts.push({})
	};

	$scope.removeContact = function (index) {
		$scope.serviceOrder.contacts.splice(index, 1);
	};
	
	$scope.addItem = function () {
		$scope.serviceOrder.items.push(new Item())
	};

	$scope.removeItem = function (index) {
		$scope.serviceOrder.items.splice(index, 1);
	};

	$scope.setItem = function(item, index) {
		$scope.serviceOrder.items[index] = new Item(item);
	};

	$scope.changed = function(field){
		if($scope.serviceOrder._id && $rootScope.userData.role._id != 1){
			var isHere = false;
			$scope.serviceOrder.fieldsChanged = $scope.serviceOrder.fieldsChanged || [];
			for(var i = 0; i < $scope.serviceOrder.fieldsChanged.length; i++){
				if($scope.serviceOrder.fieldsChanged[i].field == field){
					isHere = true;
					break;
				}
			}
			if(!isHere){
				$scope.serviceOrder.fieldsChanged.push({ field: field, by: $rootScope.userData._id });
			}
		} 
	};

	$scope.isChanged = function(field){
		if($scope.serviceOrder._id && $rootScope.userData.role._id == 1){
			var isHere = false;
			$scope.serviceOrder.fieldsChanged = $scope.serviceOrder.fieldsChanged || [];
			for(var i = 0; i < $scope.serviceOrder.fieldsChanged.length; i++){
				if($scope.serviceOrder.fieldsChanged[i].field == field){
					isHere = true;
					break;
				}
			}
			return isHere ? 'changed' : '';
		}
		return '';
	};

	$scope.isDisabled = function(){
		return $rootScope.userData.role._id != 1 && $scope.serviceOrder.status._id == 3;
	};

	$scope.uploadFiles = function(files){
		$scope.files = angular.copy(files)
		function getBase64(file) {
			var d = $q.defer();
			var reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = function () {
				d.resolve({ 
					url: reader.result,
					name: file.name,
					type: file.type,
					isNew: true
				});
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
			$scope.serviceOrder.photos = $scope.serviceOrder.photos || [];
			$scope.serviceOrder.photos = $scope.serviceOrder.photos.concat(urls)
		})
	};

	$scope.showPicture = function(index){
		$scope.serviceOrder.showPicture(index);
	};

	$scope.removePhoto = function(index){
		$scope.serviceOrder.photos.splice(index, 1);
	};

	$scope.addItemCollection = function(){
		var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.serviceOrder.client });
		dialog.result
		.then(function (res) {
			//add items to collection serviceOrder.items
			for(var i = 0; i < res.length; i++){
				var isHere = -1;
				for(var j = 0; j < $scope.serviceOrder.items.length; j++){
					if(res[i]._id == $scope.serviceOrder.items[j]._id){
						isHere = j;
						break;
					}
				}
				if(isHere != -1){
					$scope.serviceOrder.items[isHere].quantity++;
				}
				else {
					$scope.serviceOrder.items.push(res[i]);
				}
			}
			
		}, function (error) {
		});
	};

	$scope.save = function () {
		delete $scope.serviceOrder.client.account.password;
		$scope.serviceOrder.save()
		.then(function (data) {
			toaster.success('The Service Order was saved successfully');
			$location.path('serviceOrderList')
		},
			function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};

	$scope.delete = function(){
		var dlg = dialogs.confirm('Warning','Are you sure you want to delete?');
		dlg.result.then(function(btn){
			$scope.serviceOrder.remove()
			.then(function(){
				toaster.success('The service order was deleted successfully');
				$location.path('/serviceOrderList')
			});
		});
	};

	$scope.export = function(){
		$scope.serviceOrder.download();
	};

	$scope.send = function(){
		$scope.serviceOrder.send();
	};

	if(serviceOrder.client){
		$scope.clientChanged(serviceOrder.client);
	}
});
