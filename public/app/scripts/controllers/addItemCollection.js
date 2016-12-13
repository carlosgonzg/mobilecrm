'use strict';

angular.module('MobileCRMApp')
.controller('AddItemCollectionCtrl', function ($scope, data, $uibModalInstance, toaster, ItemCollection, Item) {
	$scope.itemCollections = [];

	$scope.getItems = function(itemCollection){
		var query = {
			'clients._id': data.client._id,
			_id: {
				$in: itemCollection.items
			}
		};
		new Item().filter(query)
		.then(function(res){
			$scope.items = res.data;
			for(var i in $scope.items){
				$scope.items[i].import = true;
			}
		});
	};

	$scope.close = function(){
		$uibModalInstance.dismiss();
	};

	$scope.set = function(){
		var items = _.filter($scope.items, function(obj){ return obj.import == true; });
		$uibModalInstance.close(items);
	};

	//getting item collections
	new ItemCollection().filter({})
	.then(function(res){
		$scope.itemCollections = res.data || [];
	});
});