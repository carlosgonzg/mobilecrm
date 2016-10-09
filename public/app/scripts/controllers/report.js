'use strict';

angular.module('MobileCRMApp')
.controller('ReportCtrl', function ($scope, $rootScope, toaster, clients, countries, OrderService) {
	var today = new Date();

	$scope.selectedTab = 'data';
	$scope.orderServices = [];
	$scope.clientList = clients.data;
	$scope.clientList.unshift({
		_id: -1,
		entity: {
			fullName: 'All'
		}
	});

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

	$scope.statusList = [{
		_id: -1,
		description: 'All'
	},{
		_id: 1,
		description: 'Pending'
	},{
		_id: 2,
		description: 'In Progress'
	},{
		_id: 3,
		description: 'Done'
	},{
		_id: 4,
		description: 'Paid'
	}];

	$scope.filter = {
		fromDate: new Date(today.getFullYear(), today.getMonth(), 1),
		toDate: today,
		client: { _id: -1 },
		status: { _id: -1 },
		country: { _id: -1 },
		state: { _id: -1 },
		city: { _id: -1 },
		isOpen: true
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
		for(var i = 0; i < $scope.orderServices.length; i++){
			var orderService = $scope.orderServices[i];
			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == orderService.status._id){
					obj.status[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					value: 1,
					_id: orderService.status._id,
					label: orderService.status.description
				});
			}

			var isHere = false;
			var client = {};
			for(var j = 0; j < obj.count.length; j++){
				if(obj.count[j]._id == orderService.client._id){
					obj.count[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.count.push({
					value: 1,
					_id: orderService.client._id,
					label: orderService.client.entity.fullName
				});
			}

			var isHere = false;
			for(var j = 0; j < obj.price.length; j++){
				if(obj.price[j]._id == orderService.client._id){
					obj.price[j].value += orderService.total;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.price.push({
					value: orderService.total,
					_id: orderService.client._id,
					label: orderService.client.entity.fullName
				});
			}
		}
		return obj;
	};
	var drawChart = function(){
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
		$scope.orderServices = [];
		new OrderService().filter(query)
		.then(function(orderServices){
			$scope.orderServices = orderServices.data;
			if($scope.selectedTab != 'data')
				drawChart();
		});
	};

	$scope.search();

});
