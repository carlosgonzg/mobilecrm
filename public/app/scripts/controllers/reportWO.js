'use strict';

angular.module('MobileCRMApp')
.controller('ReportWOCtrl', function ($scope, $rootScope, toaster, clients, countries, WorkOrder, $timeout, dialogs, statusList, companyList, items, Loading, Branch) {
	var today = new Date();
	$scope.isClient = $rootScope.userData.role._id != 1;
	$scope.selectedTab = 'data';
	$scope.workOrders = [];
	$scope.clientList = clients.data;
	$scope.clientList.unshift({
		_id: -1,
		entity: {
			fullName: 'All'
		}
	});

	$scope.itemList = items.data;
	$scope.itemList.unshift({
		_id: -1,
		description: 'All'
	});

	$scope.sort = {
		field: 'date',
		order: 1
	};

	$scope.countryList = countries.data;
	$scope.countryList.unshift({
		_id: -1,
		description: 'All'
	});

	$scope.stateList = [{
		_id: -1,
		description: '--------'
	}];

	$scope.cityList = [{
		_id: -1,
		description: '--------'
	}];

	$scope.statusList = statusList;
	$scope.statusList.unshift({
		_id: -1,
		description: 'All'
	});
	var queryDescription = {};

	$scope.companyList = companyList.data;
	$scope.companyList.unshift({
		_id: -1,
		entity: {
			name: 'All'
		}
	});

	$scope.setBranches = function(company){
		$scope.branchList = [{
			_id: -1,
			code: 'All',
			name: 'All'
		}];
		new Branch().filter({ 'company._id': company._id })
		.then(function(result){
			$scope.filter.branch._id = -1;
			$scope.branchList = $scope.branchList.concat(result.data);
		});
	};

	$scope.filter = {
		fromDate: new Date(today.getFullYear(), today.getMonth(), 1),
		toDate: today,
		client: $rootScope.userData.role._id != 1 ? { _id: $rootScope.userData._id } : { _id: -1 },
		item: { _id: -1 },
		status: { _id: -1 },
		country: { _id: -1 },
		state: { _id: -1 },
		city: { _id: -1 },
		company: { _id: -1 },
		branch: { _id: -1 },
		isOpen: true,
		sort: $scope.sort
	};

	$scope.sortBy = function(field){
		if($scope.sort.field == field){
			$scope.sort.order = $scope.sort.order == 1 ? -1 : 1;
		}
		else {
			$scope.sort.field = angular.copy(field);
			$scope.sort.order = 1;
		}
		$scope.search();
	}
	$scope.showComment = function(workOrder){
		var dialog = dialogs.create('views/comment.html', 'CommentCtrl', { comment: workOrder.comment });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	$scope.showYardComment = function(workOrder){
		var dialog = dialogs.create('views/comment.html', 'CommentCtrl', { comment: workOrder.yardComment });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	$scope.showItems = function(workOrder){
		var comment = '';
		for(var i = 0; i < workOrder.items.length; i++){
			comment +=  '(' + workOrder.items[i].code + ') ' + workOrder.items[i].description + ', Quantity: ' + workOrder.items[i].quantity.toString() + '<br/>';
		}
		var dialog = dialogs.create('views/comment.html', 'CommentCtrl', { comment: comment });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	$scope.getStates = function(){
		if($scope.filter.country._id == -1){
			$scope.stateList = [{
				_id: -1,
				description: '--------'
			}];

			$scope.cityList = [{
				_id: -1,
				description: '--------'
			}];
			$scope.filter.state = { _id: -1 };
			$scope.filter.city = { _id: -1 };
		}
		else {
			$scope.filter.country.getMyStates()
			.then(function(states){
				$scope.stateList = states.data;
				$scope.stateList.unshift({
					_id: -1,
					description: 'All'
				});
				$scope.cityList = [{
					_id: -1,
					description: '--------'
				}];
				$scope.filter.state = { _id: -1 };
				$scope.filter.city = { _id: -1 };
			});
		}
	};

	$scope.getCities = function(){
		if($scope.filter.state._id == -1){
			$scope.cityList = [{
				_id: -1,
				description: '--------'
			}];
			$scope.filter.city = { _id: -1 };
		}
		else {
			$scope.filter.state.getMyCities()
			.then(function(cities){
				$scope.cityList = cities.data;
				$scope.cityList.unshift({
					_id: -1,
					description: 'All'
				});
			});
			$scope.filter.city = { _id: -1 };
		}
	};

	$scope.getActiveTab = function(tab){
		return tab == $scope.selectedTab;
	};

	$scope.selectTab = function(tab){
		$scope.selectedTab = tab;
		if($scope.selectedTab != 'data')
			drawChart();
	};

	var chartData = function(){
		var obj = {
			status: [],
			count: [],
			price: []
		};
		for(var i = 0; i < $scope.workOrders.length; i++){
			var workOrder = $scope.workOrders[i];
			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == workOrder.status._id){
					obj.status[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					value: 1,
					_id: workOrder.status._id,
					label: workOrder.status.description
				});
			}

			var isHere = false;
			var client = {};
			for(var j = 0; j < obj.count.length; j++){
				if(obj.count[j]._id == workOrder.client._id){
					obj.count[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.count.push({
					value: 1,
					_id: workOrder.client._id,
					label: workOrder.client.entity.fullName
				});
			}

			var isHere = false;
			for(var j = 0; j < obj.price.length; j++){
				if(obj.price[j]._id == workOrder.client._id){
					obj.price[j].value += workOrder.total;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.price.push({
					value: workOrder.total,
					_id: workOrder.client._id,
					label: workOrder.client.entity.fullName
				});
			}
		}
		return obj;
	};
	var drawChart = function(){
		Loading.hide();
		$timeout(function(){
			var chartType = ['totalPriceByClient', 'countByClient'].indexOf($scope.selectedTab) != -1 ? 'column' : 'pie';
			var data = chartData();

			var seriesData = [];
			if(chartType == 'pie'){
				seriesData = [{
					name: 'Amount',
					colorByPoint: true,
					data: []
				}];
			}
			var array = $scope.selectedTab == 'totalPriceByClient' ? data.price : $scope.selectedTab == 'countByClient' ? data.count : $scope.selectedTab == 'status' ? data.status : [];
			for(var i = 0; i < array.length; i++){
				if(chartType == 'pie'){
					seriesData[0].data.push({
						name: array[i].label,
						y: array[i].value
					});
				}
				else {
					seriesData.push({
						name: array[i].label,
						data: [ array[i].value ]
					});
				}
			}
			var myChart = Highcharts.chart('chart_container', {
		        chart: {
		            type: chartType
		        },
		        title: {
		            text: ''
		        },
		        xAxis: {
		            categories: ['Amount']
		        },
		        yAxis: {
		            title: {
		                text: ''
		            }
		        },
		        series: seriesData
		    });
		});
	};
	$scope.getTotal = function(){
		var total = 0;
		for(var i = 0; i< $scope.workOrders.length; i++){
			total += $scope.workOrders[i].getTotal();
		}
		return total;
	};
	var setQuery = function(params){
		var query = {
			$and: []
		};
		queryDescription = {}
		//primero las fechas (siempre son obligatorias)
		query.$and.push({
			date: {
				$gte: $scope.filter.fromDate,
				$lte: $scope.filter.toDate
			}
		});
		//ahora company
		if($scope.filter.company._id != -1){
			query.$and.push({
				'client.company._id': $scope.filter.company._id
			});
			queryDescription.company =  params.company.entity.name;
		}
		//ahora el branch
		if($scope.filter.branch._id != -1){
			query.$and.push({
				'client.branch._id': $scope.filter.branch._id
			});
			queryDescription.branch = params.branch.name;
		}
		//ahora el cliente
		if(params.client._id != -1){
			query.$and.push({
				'client._id': params.client._id
			});
			queryDescription.client = params.client.entity.fullName;
		}
		//ahora el status
		if(params.status._id != -1){
			query.$and.push({
				'status._id': params.status._id
			});
			queryDescription.status = params.status.description;
		}
		//ahora el pais
		if($scope.filter.country._id != -1){
			query.$and.push({
				'siteAddress.country._id': $scope.filter.country._id
			});
		}
		//ahora el estado
		if($scope.filter.state._id != -1){
			query.$and.push({
				'siteAddress.state._id': $scope.filter.state._id
			});
		}
		//ahora la ciudad
		if($scope.filter.city._id != -1){
			query.$and.push({
				'siteAddress.city._id': $scope.filter.city._id
			});
		}
		//ahora customer y parts from the yard
		if($scope.filter.partsFromTheYard){
			query.$and.push({
				'partsFromTheYard': $scope.filter.partsFromTheYard
			});
		}
		//ahora la client responsible
		if($scope.filter.clientResponsibleCharges){
			query.$and.push({
				'clientResponsibleCharges': $scope.filter.clientResponsibleCharges
			});
		}
		//item
		if($scope.filter.item){
			query.$and.push({
				'items.code': $scope.filter.item.code
			});
			if($scope.filter.itemQuantity > 0){
				query.$and.push({
					'items.quantity': $scope.filter.itemQuantity
				});
			}
		}
		return query;
	};

	//Search function
	$scope.search = function(){
		$scope.filter.isOpen = false;
		var query = setQuery($scope.filter);
		//ahora listado de order services
		$scope.workOrders = [];
		Loading.show();
		new WorkOrder().filter(query, $scope.sort)
		.then(function(workOrders){
			$scope.workOrders = workOrders.data;
			Loading.hide();
			if($scope.selectedTab != 'data')
				drawChart();
		});
	};
	$scope.export = function(){
		var query = setQuery($scope.filter);
		new WorkOrder().getReport(query, queryDescription);
	};
	$scope.search();

});
