'use strict';

angular.module('MobileCRMApp')
.controller('ReportSOCtrl', function ($scope, $rootScope, toaster, clients, countries, ServiceOrder, $timeout, dialogs, statusList, Loading) {
	var today = new Date();
	$scope.isClient = $rootScope.userData.role._id != 1;
	$scope.selectedTab = 'data';
	$scope.serviceOrders = [];
	$scope.clientList = clients.data;
	$scope.clientList.unshift({
		_id: -1,
		entity: {
			fullName: 'All'
		}
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

	$scope.filter = {
		fromDate: new Date(today.getFullYear(), today.getMonth(), 1),
		toDate: today,
		client: $rootScope.userData.role._id != 1 ? { _id: $rootScope.userData._id } : { _id: -1 },
		status: { _id: -1 },
		country: { _id: -1 },
		state: { _id: -1 },
		city: { _id: -1 },
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
	$scope.showComment = function(serviceOrder){
		var dialog = dialogs.create('views/comment.html', 'CommentCtrl', { comment: serviceOrder.comment });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	$scope.showYardComment = function(serviceOrder){
		var dialog = dialogs.create('views/comment.html', 'CommentCtrl', { comment: serviceOrder.yardComment });
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
		for(var i = 0; i < $scope.serviceOrders.length; i++){
			var serviceOrder = $scope.serviceOrders[i];
			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == serviceOrder.status._id){
					obj.status[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					value: 1,
					_id: serviceOrder.status._id,
					label: serviceOrder.status.description
				});
			}

			var isHere = false;
			var client = {};
			for(var j = 0; j < obj.count.length; j++){
				if(obj.count[j]._id == serviceOrder.client._id){
					obj.count[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.count.push({
					value: 1,
					_id: serviceOrder.client._id,
					label: serviceOrder.client.entity.fullName
				});
			}

			var isHere = false;
			for(var j = 0; j < obj.price.length; j++){
				if(obj.price[j]._id == serviceOrder.client._id){
					obj.price[j].value += serviceOrder.total;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.price.push({
					value: serviceOrder.total,
					_id: serviceOrder.client._id,
					label: serviceOrder.client.entity.fullName
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
	//Search function
	$scope.search = function(){
		$scope.filter.isOpen = false;
		var query = {
			$and: []
		};
		//primero las fechas (siempre son obligatorias)
		query.$and.push({
			date: {
				$gte: $scope.filter.fromDate,
				$lte: $scope.filter.toDate
			}
		});
		//ahora el cliente
		if($scope.filter.client._id != -1){
			query.$and.push({
				'client._id': $scope.filter.client._id
			});
		}
		//ahora el status
		if($scope.filter.status._id != -1){
			query.$and.push({
				'status._id': $scope.filter.status._id
			});
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
		//ahora la ciudad
		if($scope.filter.clientResponsibleCharges){
			query.$and.push({
				'clientResponsibleCharges': $scope.filter.clientResponsibleCharges
			});
		}
		//ahora listado de order services
		$scope.serviceOrders = [];
		Loading.show();
		new ServiceOrder().filter(query, $scope.sort)
		.then(function(serviceOrders){
			$scope.serviceOrders = serviceOrders.data;
			Loading.hide();
			if($scope.selectedTab != 'data')
				drawChart();
		});
	};

	$scope.search();

});
