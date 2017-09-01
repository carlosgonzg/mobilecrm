'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ServiceOrderCtrl', function ($scope, $rootScope, $location, toaster, User, statusList, serviceOrder, Item, dialogs, $q, Branch) {
	$scope.serviceOrder = serviceOrder;

	$scope.items = [];
	$scope.params = {};
	$scope.branches = [];
	$scope.readOnly = $rootScope.userData.role._id != 1;
	if($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5) {
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
	$scope.addresses = [];
	var address = {};

	$scope.serviceOrder.siteAddressFrom = $scope.serviceOrder.client ? $scope.serviceOrder.client.branch.addresses[0] : {};
	console.log($scope.serviceOrder.siteAddressFrom)

	$scope.getBranches = function(){

		$scope.branches = [];
		new Branch().filter({})
		.then(function(res){
			$scope.branches = res.data;
			for (var i=0; i<$scope.branches.length;i++) {
				if ($scope.branches[i].addresses.length>0) {
					address = $scope.branches[i].addresses[0];
					address.addressString = address ? address.city.description + " - " + address.address1 + ", " + address.state.id : "";
					$scope.addresses.push(address)
				}
			}
		});
	};

	$scope.recalculate = function () {
		console.log($scope.serviceOrder.siteAddressFrom)
		$scope.serviceOrder.siteAddress.distanceFrom = $scope.serviceOrder.siteAddressFrom.address1 && $scope.serviceOrder.siteAddress.address1 ? getDistance($scope.serviceOrder.siteAddress, $scope.serviceOrder.siteAddressFrom) : 0;
	}

	var getDistance = function(p1, p2) {
				var p1 = new google.maps.LatLng(p1.latitude, p1.longitude);
				var p2 = new google.maps.LatLng(p2.latitude, p2.longitude);
				var distance = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
				return parseFloat((distance * 0.00062137).toFixed(2));
	};

	$scope.wsClassItem = Item;
	$scope.wsFilterItem =  $rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5 ? { 'companies._id': $rootScope.userData.company._id }: { };
	$scope.wsFieldsItem = [{
			label : 'Code',
			field : 'code',
			type : 'text',
			show: true
		},{
			label : 'Description',
			field : 'description',
			type : 'text',
			show: true
		},{
			label : 'Part',
			field : 'part',
			type : 'text',
			show: true
		},{
			label : 'Unit of Measure',
			field : 'unitOfMeasure',
			type : 'text',
			show: true
		}, {
			label : 'Price',
			field : 'price',
			type : 'currency',
			show: true
		}
	];

	$scope.clientChanged = function(client){ 
		if(client && client.company)
			$scope.wsFilterItem =  $rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5 ? { 'companies._id': $rootScope.userData.company._id } : { 'companies._id': client.company._id };
		/*
		$scope.items = [];
		for(var i = 0; i < items.data.length; i++){
			if(!items.data[i].clients && !items.data[i].companies){
				$scope.items.push(items.data[i]);
			}
			else {
				for(var j = 0; j < items.data[i].companies.length; j++){
					if(items.data[i].companies[j]._id == (client && client.company ? client.company._id : -1)){
						$scope.items.push(items.data[i]);
						break;
					}
				}
			}
		}*/
	};

	$scope.addContact = function () {
		$scope.serviceOrder.contacts.push({})
	};

	$scope.removeContact = function (index) {
		$scope.serviceOrder.contacts.splice(index, 1);
	};
	
	$scope.addItem = function (item) {
		$scope.serviceOrder.items.unshift(item);
		$scope.params.item = {};
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

		if (field === "status") {
				$scope.setNoInvoice();
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
		return $rootScope.userData.role._id != 1 && $scope.serviceOrder.status._id == 3 || $scope.userData.role._id == 5;
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
				if(isHere != -1 && $scope.serviceOrder.items[isHere].price == res[i].price){
					$scope.serviceOrder.items[isHere].quantity += res[i].quantity;
				}
				else {
					$scope.serviceOrder.items.unshift(res[i]);
				}
			}
			
		}, function (error) {
		});
	};

	$scope.save = function (sendMail) {
		delete $scope.serviceOrder.client.account.password;
		if(sendMail)
			$scope.serviceOrder.sendMail = true;
		$scope.serviceOrder.save()
		.then(function (data) {
			toaster.success('The Service Order was saved successfully');
			$location.path('serviceOrderList')
		},
			function (error) {
			console.log(error);
			toaster.error('The Service Order couldn\'t be saved, please check if some required field is empty or if its duplicated');
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

	$scope.setNoInvoice = function () {
		console.log($scope.serviceOrder.status._id)
		var array = [5,7]
		if ($scope.serviceOrder.status._id === 5 || $scope.serviceOrder.status._id === 7) {
			$scope.serviceOrder.invoiceNumber = "No Invoice";
		} else {
			$scope.serviceOrder.invoiceNumber = "Pending Invoice";
		}
	}

	if(serviceOrder.client){
		$scope.clientChanged(serviceOrder.client);
	}

	$scope.getBranches();

});
