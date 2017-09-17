'use strict';

angular.module('MobileCRMApp')
.controller('ReportExpensesCtrl', function ($scope, $rootScope, toaster, clients, countries, Invoice, $timeout, dialogs, statusList, companyList, Loading, Branch) {
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
	var categories=[];

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
	var queryDescription = {}

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

		categories = [];

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
				if(obj.count[j]._id == invoice.clientId){
					obj.count[j].value++;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.count.push({
					value: 1,
					_id: invoice.clientId,
					label: invoice.client
				});
			}

			var isHere = false;
			for(var j = 0; j < obj.price.length; j++){
				if(obj.price[j]._id == invoice.clientId){
					obj.price[j].value += invoice.totalExpenses;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.price.push({
					value: invoice.getTotal(),
					_id: 1,
					label: 'Price',
					client: invoice.client,
					value2: invoice.totalExpenses,
					value3: invoice.getTotal() - invoice.totalExpenses
				});
			}

			if (categories.indexOf(invoice.client) === -1) {
				categories.push(invoice.client)
			}

		}
		return obj;
	};
	var drawChart = function(){
		Loading.hide();
		$timeout(function(){
			var chartType = ['totalPriceByClient', 'countByClient'].indexOf($scope.selectedTab) != -1 ? 'column' : 'pie';
			
			var plotOptionsAmount = {
				series : {
					stacking:'normal'
				}
			}
			var plotOptionsOthers = {
				bar: {
		            dataLabels: {
		                enabled: true
		            }
		        }
			}

			var plotOptions = $scope.selectedTab === 'totalPriceByClient' ? plotOptionsAmount: plotOptionsOthers;
			var data = chartData();

			var seriesData = [];
			if(chartType == 'pie'){
				seriesData = [{
					name: 'Amount',
					colorByPoint: true,
					data: []
				}];
			}

			if ($scope.selectedTab === "totalPriceByClient") {
				seriesData = [
					// {
					// 	name : 'Price',
					// 	data :[]
					// },
					{
						name : 'Expenses',
						data :[]
					},
					{
						name : 'Profit',
						data :[]
					},
				]
			} else {
				seriesData = [
					{
						name : "Count",
						data : []
					}
				]
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

					if ($scope.selectedTab === 'totalPriceByClient') {
						if (categories.indexOf(array[i].client) === -1) {
							// seriesData[0].data.push(array[i].value);
							seriesData[0].data.push(array[i].value2);
							seriesData[1].data.push(array[i].value3);
						} else {
							// seriesData[0].data[categories.indexOf(array[i].client)] = (seriesData[0].data[categories.indexOf(array[i].client)] || 0) + array[i].value
							seriesData[0].data[categories.indexOf(array[i].client)] = (seriesData[0].data[categories.indexOf(array[i].client)] || 0) + array[i].value2
							seriesData[1].data[categories.indexOf(array[i].client)] = (seriesData[1].data[categories.indexOf(array[i].client)] || 0) + array[i].value3
						}
						
					} else {
						seriesData[0].data.push(array[i].value)
					}



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
		            categories: categories
		        },
		        yAxis: {
		            title: {
		                text: ''
		            }
		        },
		        series: seriesData,
		        plotOptions:plotOptions
		    });

		    console.log(seriesData)

		});
	};
	var setQuery = function(params){
		var query = {
			$and: [],
		};
		//primero las fechas (siempre son obligatorias)
		query.$and.push({
			date: {
				$gte: params.fromDate,
				$lte: params.toDate
			}
		});
		query.$and.push({
			expenses: {
				$exists: true
			}
		});
		queryDescription.expenses = true;
		//ahora el cliente
		if(params.client._id != -1){
			query.$and.push({
				'client._id': params.client._id
			});
		}
		//ahora el status
		if(params.status._id != -1){
			query.$and.push({
				'status._id': params.status._id
			});
		}
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
		}
		//ahora el branch
		if($scope.filter.branch._id != -1){
			query.$and.push({
				'client.branch._id': $scope.filter.branch._id
			});
		}
		//ahora customer y parts from the yard
		if(params.pendingPO){
			query.$and.push({
				'pono': ""
			});
		}

		if(params.withPO){
			query.$and.push({
				'pono': {$ne: ""}
			});
		}
		return query;
	}
	//Search function
	$scope.search = function(){
		$scope.filter.isOpen = false;
		var start = $scope.filter.fromDate;
		var end = $scope.filter.toDate;
		var query = setQuery($scope.filter);
		//ahora listado de order services
		$scope.invoices = [];
		Loading.show();
		new Invoice().filter(query, start, end)
		.then(function(invoices){
			var invoicesList = invoices.data;
			
			for(var i = 0; i < invoicesList.length; i++){
				var inv = {
					_id: invoicesList[i]._id,
					invoiceNumber: invoicesList[i].invoiceNumber,
					document: invoicesList[i].sor || invoicesList[i].wor,
					clientId: invoicesList[i].client._id,
					client: invoicesList[i].client.entity.fullName,
					company: invoicesList[i].client.company.entity.name,
					branch: invoicesList[i].client.branch.name,
					items: invoicesList[i].items,
					expenses: invoicesList[i].expenses,
					totalIncome: 0,
					totalExpenses: 0,
					date: invoicesList[i].date
				};
				for(var j = 0; j < invoicesList[i].items.length; j++){
					inv.totalIncome += invoicesList[i].items[j].quantity * invoicesList[i].items[j].price;
				}
				for(var j = 0; j < invoicesList[i].expenses.length; j++){
					inv.totalExpenses += invoicesList[i].expenses[j].price;
				}
				$scope.invoices.push(new Invoice(inv));
			}

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
