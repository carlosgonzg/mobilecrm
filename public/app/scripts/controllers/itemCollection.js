'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ItemCollectionCtrl', function ($scope, itemCollection, User, items, $location, toaster) {
	$scope.params = { quantity: 1 };
	$scope.items = items.data;
	$scope.itemCollection = itemCollection;

	$scope.addItem = function(item, quantity){
		if(!item){
			toaster.error('You need to select an item first!.');
			throw new Error('validation: item');
		}
		if($scope.itemCollection.items.indexOf(item._id) == -1){
			$scope.itemCollection.items.push(item._id);
			$scope.itemCollection.itemsQuantity[item._id] = quantity || 1;
			$scope.itemCollection.setTotal(items.data);
		}
		else {
			toaster.warning('The item is already in here');
		}
		$scope.params.item = null;
		$scope.params.quantity = 1;
	};

	$scope.removeItem = function(index){
		$scope.itemCollection.items.splice(index, 1);
	};

	$scope.getItem = function(itemId){
		var item = _.filter(items.data, function(obj){ return obj._id == itemId; })
		return item.length > 0 ? item[0] : {};
	};

	$scope.save = function () {
		if($scope.itemCollection.items.length <= 1){
			toaster.error('You need at least two items to proceed!.');
			throw new Error('validation: items');
		}
		$scope.itemCollection.save()
		.then(function (data) {
			toaster.success('The Item Collection was saved successfully');
			$location.path('itemCollectionList')
		},
		function (error) {
			console.log(error);
			toaster.error(error.message);
		});
	};

	$scope.itemCollection.setTotal(items.data);
});
