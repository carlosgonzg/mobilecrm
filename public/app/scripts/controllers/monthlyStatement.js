'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
.controller('MonthlyStatementCtrl', function ($scope, $rootScope, Invoice, Loading, dialogs, searchList, userList, companyList, branchList, toaster) {
	var today = new Date();
	$scope.searchList = searchList || [];
	$scope.searchWhoList = [];
	$scope.selectedTab = 'month';

	$scope.months = [];
	for(var i = 1; i <= 12; i++){
		$scope.months.push({
			year: today.getFullYear(),
			month: i
		});
	}

	$scope.params = {
		searchBy: {
			code: 'MobileOne',
			description: 'MobileOne'
		},
		searchWho: null
	};

	if($rootScope.userData.role._id != 1){
		$scope.getList('User');
		$scope.params.searchBy = {
			code: 'User',
			description: 'Customer'
		};
		$scope.params.searchWho = $rootScope.userData._id
	}

	$scope.getActiveTab = function(tab){
		return tab == $scope.selectedTab;
	};

	$scope.selectTab = function(tab){
		$scope.selectedTab = tab;
	};

	$scope.getPaid = function(year, month){
		return _.reduce($scope.invoices, function(memo, value){
			return memo + (year == value.year && month == value.month && value.status._id == 4 ? value.total : 0);
		}, 0);
	};
	$scope.getPending = function(year, month){
		return _.reduce($scope.invoices, function(memo, value){
			return memo + (year == value.year && month == value.month && value.status._id == 1 ? value.total : 0);
		}, 0);
	};
	$scope.getPendingPay = function(year, month){
		return _.reduce($scope.invoices, function(memo, value){
			return memo + (year == value.year && month == value.month && value.status._id == 3 ? value.total : 0);
		}, 0);
	};
	$scope.getTotal = function(year, month){
		return _.reduce($scope.invoices, function(memo, value){
			return memo + (year == value.year && month == value.month ? value.total : 0);
		}, 0);
	};

	$scope.getList = function(list){
		Loading.show();
		switch(list){
			case 'User':
				$scope.searchWhoList = angular.copy(userList.data);
			break;
			case 'Company':
				$scope.searchWhoList = angular.copy(companyList.data);
			break;
			case 'Branch':
				$scope.searchWhoList = angular.copy(branchList.data);
			break;
		}
		$scope.params.searchWho = null;
		Loading.hide();
	};
	var generateQuery = function(params){
		if(params.searchBy.code != 'MobileOne' && !params.searchWho){
			toaster.error('', params.searchBy.description + ' is required.');
			throw new Error('Not enough params');
		}
		var query = {};
		if(params.searchBy.code == 'User'){
			query.clientId = params.searchWho;
		}
		else if(params.searchBy.code == 'Company'){
			query.companyId = params.searchWho;
		}
		else if(params.searchBy.code == 'Branch'){
			query.branchId = params.searchWho;
		}
		
		query.from = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
		query.to = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
		return query;
	};
	$scope.search = function(params){
		var query = generateQuery(params);
		Loading.show();
		$scope.invoices = [];
		new Invoice().getMonthlyStatement(query)
		.then(function(result){
			console.log(result);
			$scope.invoices = result;
			Loading.hide();
		})
	};
	$scope.export = function(params, format){
		var query = generateQuery(params);
		new Invoice().exportMonthlyStatement(query, format);
	};
	$scope.goTo = function(invoice){
		invoice.goTo();
	};
	$scope.changeStatus = function(invoice){
		invoice.changeStatus()
		.then(function(res){
			$scope.search($scope.params);
		});
	};
});
