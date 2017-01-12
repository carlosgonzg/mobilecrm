'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('WorkOrderCtrl', function ($scope, $rootScope, $location, toaster, User, statusList, workOrder, items, Item, dialogs, $q, Company) {
	$scope.workOrder = workOrder;
	$scope.items = [];
	$scope.params = {};
	$scope.readOnly = $rootScope.userData.role._id != 1;
	if($rootScope.userData.role._id != 1){
		$scope.workOrder.client = new User($rootScope.userData);
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
			if(!items.data[i].clients && !items.data[i].companies){
				$scope.items.push(items.data[i]);
			}
			else {
				for(var j = 0; j < items.data[i].companies.length; j++){
					if(items.data[i].companies[j]._id ==  (client && client.company ? client.company._id : -1)){
						$scope.items.push(items.data[i]);
						break;
					}
				}
			}
		}
		if(client && client.company){
			new Company().filter({ _id: client.company._id})
			.then(function(result){
				$scope.workOrder.siteAddress = angular.copy(result.data[0].address);
			})
			.catch(function(){
				$scope.workOrder.siteAddress = angular.copy(client.company.address);
			})
		}
	};

	$scope.addContact = function () {
		$scope.workOrder.contacts.push({})
	};

	$scope.removeContact = function (index) {
		$scope.workOrder.contacts.splice(index, 1);
	};
	
	$scope.addItem = function (item) {
		$scope.workOrder.items.unshift(item);
		$scope.params.item = {};
	};

	$scope.removeItem = function (index) {
		$scope.workOrder.items.splice(index, 1);
	};

	$scope.setItem = function(item, index) {
		$scope.workOrder.items[index] = new Item(item);
	};

	$scope.addItemCollection = function(){
		var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.workOrder.client });
		dialog.result
		.then(function (res) {
			//add items to collection workOrder.items
			for(var i = 0; i < res.length; i++){
				var isHere = -1;
				for(var j = 0; j < $scope.workOrder.items.length; j++){
					if(res[i]._id == $scope.workOrder.items[j]._id){
						isHere = j;
						break;
					}
				}
				if(isHere != -1 && $scope.workOrder.items[isHere].price == res[i].price){
					$scope.workOrder.items[isHere].quantity += res[i].quantity;
				}
				else {
					$scope.workOrder.items.unshift(res[i]);
				}
			}
		}, function (error) {
		});
	};

	$scope.changed = function(field){
		if($scope.workOrder._id && $rootScope.userData.role._id != 1){
			var isHere = false;
			$scope.workOrder.fieldsChanged = $scope.workOrder.fieldsChanged || [];
			for(var i = 0; i < $scope.workOrder.fieldsChanged.length; i++){
				if($scope.workOrder.fieldsChanged[i].field == field){
					isHere = true;
					break;
				}
			}
			if(!isHere){
				$scope.workOrder.fieldsChanged.push({ field: field, by: $rootScope.userData._id });
			}
		} 
	};

	$scope.isChanged = function(field){
		if($scope.workOrder._id && $rootScope.userData.role._id == 1){
			var isHere = false;
			$scope.workOrder.fieldsChanged = $scope.workOrder.fieldsChanged || [];
			for(var i = 0; i < $scope.workOrder.fieldsChanged.length; i++){
				if($scope.workOrder.fieldsChanged[i].field == field){
					isHere = true;
					break;
				}
			}
			return isHere ? 'changed' : '';
		}
		return '';
	};

	$scope.isDisabled = function(){
		return $rootScope.userData.role._id != 1 && $scope.workOrder.status._id == 3;
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
			$scope.workOrder.photos = $scope.workOrder.photos || [];
			$scope.workOrder.photos = $scope.workOrder.photos.concat(urls)
		})
	};

	$scope.showPicture = function(index){
		$scope.workOrder.showPicture(index);
	};

	$scope.removePhoto = function(index){
		$scope.workOrder.photos.splice(index, 1);
	};

	$scope.save = function () {
		delete $scope.workOrder.client.account.password;
		$scope.workOrder.save()
		.then(function (data) {
			toaster.success('The Work Order was saved successfully');
			$location.path('workOrderList')
		},
			function (error) {
			console.log(error);
			toaster.error('The Work Order couldn\'t be saved, please check if some required field is empty or if its duplicated');
		});
	};

	$scope.delete = function(){
		var dlg = dialogs.confirm('Warning','Are you sure you want to delete?');
		dlg.result.then(function(btn){
			$scope.workOrder.remove()
			.then(function(){
				toaster.success('The work order was deleted successfully');
				$location.path('/workOrderList')
			});
		});
	};

	$scope.export = function(){
		$scope.workOrder.download();
	};

	$scope.send = function(){
		$scope.workOrder.send();
	};

	if(workOrder.client){
		$scope.clientChanged(workOrder.client);
	}
});
