'use strict';

angular.module('MobileCRMApp')
.controller('ReportInvoiceCtrl', function ($scope, $rootScope, toaster, clients, countries, Invoice, $timeout, dialogs, statusList, companyList, Loading, Branch) {
	var today = new Date();
	$scope.isClient = $rootScope.userData.role._id != 1;
	$scope.selectedTab = 'data';
	$scope.invoices = [];
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
	$scope.statusList.unshift({
		_id: -1,
		description: 'All'
	});

	var queryDescription = {};

	for (var i=0; i<statusList.length; i++) {
		if (statusList[i].description == "Completed") {
			statusList[i].description = "Completed (Pending to Pay)";
		}

		if (statusList[i].description == "Paid") {
			statusList[i].description = "Completed (Paid)";
		}
	}

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
	$scope.showComment = function(invoice){
		var dialog = dialogs.create('views/comment.html', 'CommentCtrl', { comment: invoice.comment });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	$scope.showYardComment = function(invoice){
		var dialog = dialogs.create('views/comment.html', 'CommentCtrl', { comment: invoice.yardComment });
		dialog.result
		.then(function (res) {
		}, function (res) {});
	};

	$scope.showItems = function(invoice){

		var comment = '';
		for(var i = 0; i < invoice.items.length; i++){
			comment +=  '(' + (invoice.items[i].code ? invoice.items[i].code : '') + ') ' + invoice.items[i].description + ', Quantity: ' + invoice.items[i].quantity.toString() + '<br/>';
			console.log(invoice.items[i])
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

	$scope.getTotal = function(){
		var total = 0;
		for(var i = 0; i< $scope.invoices.length; i++){
			total += $scope.invoices[i].getTotal();
		}
		return total;
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
		for(var i = 0; i < $scope.invoices.length; i++){
			var invoice = $scope.invoices[i];
			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == invoice.status._id){
					obj.status[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					value: 1,
					_id: invoice.status._id,
					label: invoice.status.description
				});
			}

			var isHere = false;
			var client = {};
			for(var j = 0; j < obj.count.length; j++){
				if(obj.count[j]._id == invoice.client._id){
					obj.count[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.count.push({
					value: 1,
					_id: invoice.client._id,
					label: invoice.client.entity.fullName
				});
			}

			var isHere = false;
			for(var j = 0; j < obj.price.length; j++){
				if(obj.price[j]._id == invoice.client._id){
					obj.price[j].value += invoice.total;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.price.push({
					value: invoice.total,
					_id: invoice.client._id,
					label: invoice.client.entity.fullName
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
	var setQuery = function(params){
		var query = {
			$and: []
		};
		queryDescription = {};
		//primero las fechas (siempre son obligatorias)
		query.$and.push({
			date: {
				$gte: params.fromDate,
				$lte: params.toDate
			}
		});

		//ahora el pais
		if(params.country._id != -1){
			query.$and.push({
				'siteAddress.country._id': params.country._id
			});
		}
		//ahora el estado
		if(params.state._id != -1){
			query.$and.push({
				'siteAddress.state._id': params.state._id
			});
		}
		//ahora la ciudad
		if(params.city._id != -1){
			query.$and.push({
				'siteAddress.city._id': params.city._id
			});
		}
		//ahora customer y parts from the yard
		if(params.partsFromTheYard){
			query.$and.push({
				'partsFromTheYard': params.partsFromTheYard
			});
		}
		//ahora client responsible for charges
		if(params.clientResponsibleCharges){
			query.$and.push({
				'clientResponsibleCharges': params.clientResponsibleCharges
			});
		}
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
			queryDescription.client = params.client;
		}
		//ahora el status
		if(params.status._id != -1){
			query.$and.push({
				'status._id': params.status._id
			});
			queryDescription.status = params.status.description;
		}
		//ahora customer y parts from the yard
		if(params.pendingPO){
			query.$and.push({
				'pono': ""
			});
			queryDescription.pendingPo = true;
		}

		if(params.withPO){
			query.$and.push({
				'pono': {$ne: ""}
			});
			queryDescription.po = true;
		}


		return query;
	}
	//Search function
	$scope.search = function(){
		$scope.filter.isOpen = false;
		var query = setQuery($scope.filter);
		//ahora listado de order services
		$scope.invoices = [];
		Loading.show();
		new Invoice().filter(query, $scope.sort)
		.then(function(invoices){
			$scope.invoices = invoices.data;
			console.log($scope.invoices)
			Loading.hide();
			if($scope.selectedTab != 'data')
				drawChart();
		});
	};
	$scope.export = function(){
		var query = setQuery($scope.filter);

		new Invoice().getReport(query, queryDescription);
	};
	$scope.search();
});
