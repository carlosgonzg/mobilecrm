'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('ItemListCtrl', function ($scope, items, companies, Item, $q, toaster, dialogs) {
	$scope.items = items.data;
	$scope.add = function(){
		var item = new Item();
		$scope.items.push(item);
	};
	$scope.remove = function(index){
		$scope.items[index]
		.remove()
		.then(function(data){
			$scope.items[$scope.selectedId].splice(index, 1);
			toaster.success('The item was removed successfully');
		})
		.catch(function(error){
			toaster.error(error.message);
		});
	};
	
	$scope.save = function(){
		var promises = [];
		for(var i = 0; i < $scope.items.length; i++){
			promises.push($scope.items[i].save());
		}
		$q.all(promises)
		.then(function(){
			toaster.success('The items were updated successfully');
		})
		.catch(function(error){
			toaster.error(error.message);
		});
	};

	$scope.assignCompanies = function(item){
		var itemCompanies = item.companies || [];
		var dialog = dialogs.create('views/assignCompanies.html', 'AssignCompaniesCtrl', { companyList: companies.data, companies: itemCompanies });
		dialog.result.then(function (res) {
			item.companies = res.companies;
		});
	};
});
