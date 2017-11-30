'use strict';

angular.module('MobileCRMApp')
.controller('AddItemCollectionCtrl', function ($scope, data, $uibModalInstance, toaster, ItemCollection, Item, User, CrewCollection) {
	$scope.itemCollections = [];
$scope.CrewCollection = [];
$scope.addedItem = [];

	$scope.getItems = function(itemCollection){
		var query = {
			'companies._id': data.client.company._id,
			_id: {
				$in: itemCollection.items
			}
		};
		new Item().filter(query)
		.then(function(res){
			$scope.items = res.data;
			for(var i in $scope.items){
				$scope.items[i].import = true;
				$scope.items[i].quantity = itemCollection.itemsQuantity[$scope.items[i]._id] || 1;
				$scope.items[i].price = itemCollection.itemsPrice[$scope.items[i]._id] || 1;
				$scope.items[i].itemCollection = {
					_id: itemCollection._id,
					description: itemCollection.description
				};
				var h = getCrewleaders($scope.items[i]);
				$scope.items[i].crewLeaderCol = h
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

	$scope.getCrewCol = function(){
		new CrewCollection().filter({ "role.description": 'Crew Leader' })
		.then(function(res){
			$scope.CrewCollection = res.data;									
		})
	}

	 function getCrewleaders(selectedItem) {
			$scope.addedItem = []			
			if (selectedItem != undefined) {
				for (var index = 0; index < $scope.CrewCollection.length; index++) {					
					var element = $scope.CrewCollection[index];
					
					if (element.CrewCollection != undefined) {
						var array = element.CrewCollection

						for (var n = 0; n < element.CrewCollection.length; n++) {
							var item = array[n];
							if (selectedItem._id == item.itemid) {
									$scope.newItem = {
										name: element.entity.fullName,
										price: item.price,
										id: element._id,
										techId: element.techId
									}
									$scope.addedItem.push($scope.newItem);															
								}
							}
						}
					}
					return $scope.addedItem;
			} else {
				setCrewleader()
			}
		}
		$scope.changedCrewLeaderValue = function (item, CrewL) {
			item.CrewLeaderSelected = CrewL;

			for (let index = 0; index < $scope.items.length; index++) {
				if ($scope.items[index]._id == item._id) {
					$scope.items[index] = item;
					break;
				}
			}
		}

$scope.getCrewCol();

});
