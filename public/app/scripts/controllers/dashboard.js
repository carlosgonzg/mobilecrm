'use strict';

angular.module('MobileCRMApp')
.controller('DashboardCtrl', function ($scope, $rootScope, toaster, clients, countries, Invoice, $timeout, dialogs, statusList, companyList, Loading, Branch, ServiceOrder, WorkOrder, DeliveryOrder, SetupTearDown, homeBusiness) {
	var today = new Date();
	$scope.isClient = $rootScope.userData.role._id != 1;
	$scope.selectedTab = 'w';
	$scope.invoices = [];
	$scope.invoicesByCompany = [];
	$scope.serviceOrders = [];
	$scope.workOrders = [];
	$scope.deliveryOrders = [];
	$scope.setUpOrders = [];
	$scope.homeBussinessOrders = [];
	$scope.servicesByOpenDays = [];
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

	var months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];

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

	$scope.invoiceTypeList = [
		{ _id: 'sor', description: 'Service Order' },
		{ _id: 'wor', description: 'Work Order' },
		{ _id: 'dor', description: 'Delivery Order' },
		{ _id: 'hor', description: 'Set Up & Teardown' },
		{ _id: 'tor', description: 'Home & Bussiness' },
		{ _id: 'smo', description: 'Service Miles Only' },
		{ _id: 'All', description: 'All' }
	];

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
		fromDate: moment().subtract(7,'days'),
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

	$scope.getValueType = function(tab){
		return tab == $scope.valueType;
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
		drawChart();
		drawCompanyChart();
		drawPieChart(1);
		drawPieChart(2);
		drawPieChart(3);
		drawPieChart(4);
		drawPieChart(5);
	};

	$scope.changeValueType = function(tab){
		$scope.valueType = tab;
		drawChart();
		drawCompanyChart();
		drawPieChart(1);
		drawPieChart(2);
		drawPieChart(3);
		drawPieChart(4);
		drawPieChart(5);
	};

	var chartData = function(){
		var obj = {
			status: [],
			count: [],
			price: [],
			serviceType: []
		};

		var invoiceByType = [];

		
		for(var i = 0; i < $scope.invoices.length; i++){
			var invoice = $scope.invoices[i];

			if (invoice.dor) {
				invoice.serviceType = {
					_id: 'dor',
					description: 'Delivery Order'
				}
			} else if (invoice.tor) {
				invoice.serviceType = {
					_id: 'tor',
					description: 'Set Up & Teardown'
				}
			} else if (invoice.hor) {
				invoice.serviceType = {
					_id: 'hor',
					description: 'Home & Bussiness'
				}
			} else if (invoice.wor) {
				invoice.serviceType = {
					_id: 'wor',
					description: 'Work Order'
				}
			} else if (invoice.sor) {
				invoice.serviceType = {
					_id: 'sor',
					description: 'Service Order'
				}
			} else {
				invoice.serviceType = {}
			};

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
			var serviceType = {};

			var isHereK = false;
			for (var j=0; j<obj.serviceType.length; j++) {
				if ($scope.invoices[i].serviceType._id == obj.serviceType[j]._id) {
					for (var k=0; k<obj.serviceType[j].status.length; k++) {
						if ($scope.invoices[i].status._id == obj.serviceType[j].status[k]._id) {
							obj.serviceType[j].status[k].countValue++;
							obj.serviceType[j].status[k].amountValue += ($scope.invoices[i].total  + $scope.invoices[i].getTaxes()) || 0;
							isHereK = true;
						}
					}
					if (!isHereK) {
						obj.serviceType[j].status.push({
							_id: $scope.invoices[i].status._id,
							label: $scope.invoices[i].status.description == 'Completed' ? 'Pending to Pay' : $scope.invoices[i].status.description,
							countValue: 1,
							amountValue: ($scope.invoices[i].total + $scope.invoices[i].getTaxes()) || 0
						});
					}
					isHere = true;
 				}
			}
			if(!isHere){
				obj.serviceType.push({
					_id: $scope.invoices[i].serviceType._id,
					label: $scope.invoices[i].serviceType.description,
					countValue: 1,
					amountValue: ($scope.invoices[i].total + $scope.invoices[i].getTaxes()) || 0,
					status: []
				});
			}

		}
		return obj;
	};

	var chartDataByCompany = function(){
		var obj = {
			company: []
		};
		
		for(var i = 0; i < $scope.invoicesByCompany.length; i++){
			var invoice = $scope.invoicesByCompany[i];



			var isHere = false;

			var isHereK = false;
			for (var j=0; j<obj.company.length; j++) {
				if ($scope.invoicesByCompany[i].client.company._id == obj.company[j]._id) {
					for (var k=0; k<obj.company[j].status.length; k++) {
						if ($scope.invoicesByCompany[i].status._id == obj.company[j].status[k]._id) {
							obj.company[j].status[k].countValue++;
							obj.company[j].status[k].amountValue += ($scope.invoicesByCompany[i].total  + $scope.invoicesByCompany[i].getTaxes()) || 0;
							isHereK = true;
						}
					}
					if (!isHereK) {
						obj.company[j].status.push({
							_id: $scope.invoicesByCompany[i].status._id,
							label: $scope.invoicesByCompany[i].status.description == 'Completed' ? 'Pending to Pay' : $scope.invoicesByCompany[i].status.description,
							countValue: 1,
							amountValue: ($scope.invoicesByCompany[i].total + $scope.invoicesByCompany[i].getTaxes()) || 0
						});
					}
					isHere = true;
 				}
			}
			if(!isHere){
				obj.company.push({
					_id: $scope.invoicesByCompany[i].client.company._id,
					label: $scope.invoicesByCompany[i].client.company.entity.name,
					countValue: 1,
					amountValue: ($scope.invoicesByCompany[i].total + $scope.invoicesByCompany[i].getTaxes()) || 0,
					status: []
				});
			}

		}

		return obj;
	};

	var chartPieDataSO = function(){
		var obj = {
			status: []
		};

		for(var i = 0; i < $scope.serviceOrders.length; i++){
			var serviceOrder = $scope.serviceOrders[i];

			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == serviceOrder.status._id){
					obj.status[j].countValue++;
					obj.status[j].amountValue += Number(serviceOrder.total);
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					countValue: 1,
					amountValue: Number(serviceOrder.total) || 0,
					_id: serviceOrder.status._id,
					label: serviceOrder.status.description
				});
			}


		}
		return obj;
	};

	var chartPieDataWO = function(){
		var obj = {
			status: []
		};

		for(var i = 0; i < $scope.workOrders.length; i++){
			var workOrder = $scope.workOrders[i];

			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == workOrder.status._id){
					obj.status[j].countValue++;
					obj.status[j].amountValue += Number(workOrder.total);
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					countValue: 1,
					amountValue: Number(workOrder.total) || 0,
					_id: workOrder.status._id,
					label: workOrder.status.description
				});
			}


		}
		return obj;
	};

	var chartPieDataDO = function(){
		var obj = {
			status: []
		};

		for(var i = 0; i < $scope.deliveryOrders.length; i++){
			var deliveryOrder = $scope.deliveryOrders[i];

			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == deliveryOrder.status._id){
					obj.status[j].countValue++;
					obj.status[j].amountValue += deliveryOrder.total;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					countValue: 1,
					amountValue: deliveryOrder.total || 0,
					_id: deliveryOrder.status._id,
					label: deliveryOrder.status.description
				});
			}


		}
		return obj;
	};

	var chartPieDataHB = function(){
		var obj = {
			status: []
		};

		for(var i = 0; i < $scope.homeBussinessOrders.length; i++){
			var homeBussinessOrder = $scope.homeBussinessOrders[i];

			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == homeBussinessOrder.status._id){
					obj.status[j].countValue++;
					obj.status[j].amountValue += homeBussinessOrder.total;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					countValue: 1,
					amountValue: homeBussinessOrder.total || 0,
					_id: homeBussinessOrder.status._id,
					label: homeBussinessOrder.status.description
				});
			}


		}
		return obj;
	};

	var chartPieDataSU = function(){
		var obj = {
			status: []
		};

		for(var i = 0; i < $scope.setUpOrders.length; i++){
			var setUpOrder = $scope.setUpOrders[i];

			// id, value y label
			var isHere = false;
			var status = {};
			for(var j = 0; j < obj.status.length; j++){
				if(obj.status[j]._id == setUpOrder.status._id){
					obj.status[j].countValue++;
					obj.status[j].amountValue += setUpOrder.total;
					isHere = true;
					break;
				}
			}
			if(!isHere){
				obj.status.push({
					countValue: 1,
					amountValue: setUpOrder.total || 0,
					_id: setUpOrder.status._id,
					label: setUpOrder.status.description
				});
			}


		}
		return obj;
	};

	var drawChart = function(){
		Loading.hide();
		$timeout(function(){
			var chartType = 'column';
			// var data = chartDataByCompany();
			var xAxis = [];
			var seriesData = [];

			var array = $scope.invoices ; //$scope.selectedTab == 'totalPriceByClient' ? data.price : $scope.selectedTab == 'countByClient' ? data.count : $scope.selectedTab == 'status' ? data.status : [];
		 	
			for (var i=0; i<array.length;i++) {
				for (j=0; j<array[i].serviceType.length;j++) {
					if (xAxis.indexOf(array[i].serviceType[j].serviceType.description) == -1) {
						xAxis.push(array[i].serviceType[j].serviceType.description)
					}
				}
			}

		 	for (var i=0; i<array.length; i++) {
		 		var valueArray = []
		 		for (var x=0;x<xAxis.length;x++) {
		 			valueArray[x] = 0;
		 		}
				for (var j=0; j<array[i].serviceType.length; j++) {
					var value = $scope.valueType == 'count' ? array[i].serviceType[j].count : array[i].serviceType[j].total;
					var index = xAxis.indexOf(array[i].serviceType[j].serviceType.description);
					valueArray[index] = value;
				}
				seriesData.push({
					name: array[i].status.description,
					data: valueArray
				});
			}


			if(chartType == 'pie'){
				seriesData = [{
					name: 'Amount',
					colorByPoint: true,
					data: []
					
				}];
			}
			var myChart = Highcharts.chart('container', {
		        chart: {
		            type: chartType
		        },
		        title: {
		            text: ''
		        },
				tooltip: {
                	headerFormat: '<b>{point.x}</b><br/>',
                	pointFormat: '{series.name}:' + ($scope.valueType == 'value' ? "US$ {point.y:,.2f}" : "{point.y:,.0f}")
                },
		        xAxis: {
		            categories: xAxis
		        },
		        yAxis: {
		            title: {
		                text: ''
		            },
			        stackLabels: {
			            enabled: true
			        }

		        },
		        series: seriesData,
		         plotOptions: {
			        column: {
			            stacking: 'normal'
			            
			        }
			    }
		    });
		});
	};

	var drawCompanyChart = function(){
		Loading.hide();
		$timeout(function(){
			var chartType = 'column';
			// var data = chartDataByCompany();
			var xAxis = [];
			var seriesData = [];

			var array = $scope.invoicesByCompany ; //$scope.selectedTab == 'totalPriceByClient' ? data.price : $scope.selectedTab == 'countByClient' ? data.count : $scope.selectedTab == 'status' ? data.status : [];
		 	
			for (var i=0; i<$scope.invoicesByCompany.length;i++) {
				for (j=0; j<$scope.invoicesByCompany[i].company.length;j++) {
					if (xAxis.indexOf($scope.invoicesByCompany[i].company[j].company.name) == -1) {
						xAxis.push($scope.invoicesByCompany[i].company[j].company.name)
					}
				}
			}


		 	for (var i=0; i<array.length; i++) {
		 		var valueArray = []
		 		for (var x=0;x<xAxis.length;x++) {
		 			valueArray[x] = 0;
		 		}
				for (var j=0; j<array[i].company.length; j++) {
					var value = $scope.valueType == 'count' ? array[i].company[j].count : array[i].company[j].total;
					var index = xAxis.indexOf(array[i].company[j].company.name);
					valueArray[index] += value;
				}
				seriesData.push({
					name: array[i].status.description,
					data: valueArray
				});
			}


			if(chartType == 'pie'){
				seriesData = [{
					name: 'Amount',
					colorByPoint: true,
					data: []
					
				}];
			}
			var myChart = Highcharts.chart('container_company', {
		        chart: {
		            type: chartType
		        },
		        title: {
		            text: ''
		        },
				tooltip: {
                	headerFormat: '<b>{point.x}</b><br/>',
                	pointFormat: '{series.name}:' + ($scope.valueType == 'value' ? "US$ {point.y:,.2f}" : "{point.y:,.0f}")
                },
		        xAxis: {
		            categories: xAxis
		        },
		        yAxis: {
		            title: {
		                text: ''
		            },
			        stackLabels: {
			            enabled: true
			        }

		        },
		        series: seriesData,
		         plotOptions: {
			        column: {
			            stacking: 'normal'
			            
			        }
			    }
		    });
		});
	};

	var drawDaysOpenChart = function(){
		Loading.hide();
		$timeout(function(){
			var chartType = 'column';
			// var data = chartDataByCompany();
			var xAxis = ['0-7','8-30','31-120','120+'];
			var seriesData = [];
			$scope.countNewServices = 0;
			var array = $scope.servicesByOpenDays; //$scope.selectedTab == 'totalPriceByClient' ? data.price : $scope.selectedTab == 'countByClient' ? data.count : $scope.selectedTab == 'status' ? data.status : [];
		 	console.log(array)
		 	for (var i=0; i<array.length; i++) {
		 		var valueArray = [0,0,0,0];
		 		for (var j=0; j<array[i].invoices.length; j++) {
					var value = Number($scope.valueType == 'count' ? 1 : array[i].invoices[j].total);
					var diff = moment().diff(array[i].invoices[j].date,'days');
					if (diff >= 0 && diff <= 7) {
						valueArray[0] += value;
						$scope.countNewServices++;
					} else if (diff > 7 && diff <= 30) {
						valueArray[1] += value;
					} else if (diff > 30 && diff <= 120) {
						valueArray[2] += value;
					} else {
						valueArray[3] += value;
					}
		 		}
				seriesData.push({
					name: array[i].serviceType,
					data: valueArray
				});
	 			
			}

			var myChart = Highcharts.chart('container_opendays', {
		        chart: {
		            type: chartType
		        },
		        title: {
		            text: ''
		        },
				tooltip: {
                	headerFormat: '<b>{point.x}</b><br/>',
                	pointFormat: '{series.name}:' + ($scope.valueType == 'value' ? "US$ {point.y:,.2f}" : "{point.y:,.0f}")
                },
		        xAxis: {
		            categories: xAxis
		        },
		        yAxis: {
		            title: {
		                text: ''
		            },
			        stackLabels: {
			            enabled: true
			        }

		        },
		        series: seriesData,
		         plotOptions: {
			        column: {
			            stacking: 'normal'
			            
			        }
			    }
		    });
		});
	};

	var drawPieChart = function(index){
		Loading.hide();
		$timeout(function(){
			var chartType = 'pie';

			var data = [];
			if (index==1) {
				data = chartPieDataSO();
			} else if (index == 2) {
				data = chartPieDataWO();
			} else if (index == 3) {
				data = chartPieDataDO();
			} else if (index == 4) {
				data = chartPieDataSU();
			} else if (index == 5) {
				data = chartPieDataHB();
			}
			var seriesData = [];
			seriesData = [{
				name: 'Amount',
				colorByPoint: true,
				data: []
			}];

			var array = data.status;
			for(var i = 0; i < array.length; i++){
				seriesData[0].data.push({
					name: array[i].label,
					y: Number($scope.valueType == 'count' ? array[i].countValue : array[i].amountValue)
				});
			}

			var myChart = Highcharts.chart('pie_container'+index, {
		        chart: {
		            type: chartType
		        },
		        title: {
		            text: ''
		        },
				tooltip: {
                pointFormat: $scope.valueType === 'value' ? "US$ {point.y:,.2f}" : "{point.y:,.0f}"
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
			$and: [{'status._id': {$nin:[5,7]}}]
		};

		query.fromDate = new Date(params.fromDate);
		query.toDate = new Date(params.toDate);

		//ahora el pais
		if(params.country._id != -1){
			query['siteAddress.country._id'] = params.country._id;
		}
		//ahora el estado
		if(params.state._id != -1){
			query['siteAddress.state._id'] = params.state._id;
		}
		//ahora customer y parts from the yard
		if(params.partsFromTheYard){
			query['partsFromTheYard'] = params.partsFromTheYard;
		}
		//ahora client responsible for charges
		if(params.clientResponsibleCharges){
			query['clientResponsibleCharges'] = params.clientResponsibleCharges;
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
			query['client.branch._id'] = $scope.filter.branch._id;
		}
		//ahora el cliente
		if(params.client._id != -1){
			query['client._id'] = params.client._id;
		}
		//ahora el status
		if(params.status._id != -1){
			query['status._id'] = params.status._id;
		}
		//ahora el invoice type
		if (params.invoiceType) {
			if (params.invoiceType == 'sor') {
				query.sor = { '$exists': true };
			}
			if (params.invoiceType == 'wor') {
				query.wor = { '$exists': true };
			}
			if (params.invoiceType == 'dor') {
				query.dor = { '$exists': true };
			}
			if (params.invoiceType == 'smo') {
				query['status._id'] = 8;
			}
		}
		//ahora customer y parts from the yard
		if(params.pendingPO){
			query.pono = "";
		}

		if(params.withPO){
			query.pono = {$ne: ""};
		}


		return query;
	}

	var setOpenServicesQuery = function(params){
		var query = {
			$and: []
		};
		
		query.$and.push({
			'status._id': {$in:[1,2,6]}
		});

		return query;
	}

	var setPieQuery = function(params){
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
		//ahora el invoice type
		if (params.invoiceType) {
			if (params.invoiceType == 'sor') {
				query.$and.push({
					'sor': { '$exists': true }
				});
			}
			if (params.invoiceType == 'wor') {
				query.$and.push({
					'wor': { '$exists': true }
				});
			}
			if (params.invoiceType == 'dor') {
				query.$and.push({
					'dor': { '$exists': true }
				});
			}
			if (params.invoiceType == 'smo') {
				query.$and.push({
					'status._id': 8
				});
			}
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

	$scope.quickFilter = function (range) {
		$scope.selectedTab = range;
		var start;
		if (range == 'w') {
			start = moment().subtract(7,'days');
		} else if (range == 'm') {
			start = moment().subtract(1,'months');
		} else if (range == 'q') {
			start = moment().subtract(4,'months');
		} else if (range == 'y') {
			start = moment().subtract(12,'months');
		}

		$scope.filter.fromDate = start;
		$scope.search();
	}

	//Search function
	$scope.search = function(){
		$scope.invoiceLoading = true;
		$scope.invoiceCLoading = true;
		$scope.workOrderLoading = true;
		$scope.serviceOrderLoading = true;
		$scope.deliveryLoading = true;
		$scope.setUpLoading = true;
		$scope.homeBussinessLoading = true;
		$scope.servicesByOpenDays = [];
		$scope.countPendingToPay = 0;
		$scope.sumPendingToPay = 0;

		$scope.filter.isOpen = false;
		var query = setQuery($scope.filter);
		var pieQuery = setPieQuery($scope.filter);
		//ahora listado de order services
		$scope.invoices = [];
		Loading.show();
		new Invoice().getInvoicesByServiceType(query)
		.then(function(invoices){
			$scope.invoices = invoices;
			Loading.hide();
			drawChart('container');
			$scope.invoiceLoading = false;
		});
		new Invoice().getInvoicesByCompany(query)
		.then(function(invoices){
			$scope.invoicesByCompany = invoices;
			Loading.hide();
			drawCompanyChart('container_company');
			$scope.invoiceCLoading = false;
		});
		new Invoice().getTotalPendingToPay()
		.then(function(invoices){
			$scope.countPendingToPay = invoices[0].count;
			$scope.sumPendingToPay = invoices[0].total;
			Loading.hide();
		});
		new ServiceOrder().filter(pieQuery, $scope.sort)
		.then(function(serviceOrders){
			$scope.serviceOrders = serviceOrders.data;
			Loading.hide();
			drawPieChart(1);
			$scope.serviceOrderLoading = false;
		});
		new WorkOrder().filter(pieQuery, $scope.sort)
		.then(function(workOrders){
			$scope.workOrders = workOrders.data;
			Loading.hide();
			drawPieChart(2);
			$scope.workOrderLoading = false;
		});
		new DeliveryOrder().filter(pieQuery, $scope.sort)
		.then(function(deliveryOrders){
			$scope.deliveryOrders = deliveryOrders.data;
			Loading.hide();
			drawPieChart(3);
			$scope.deliveryLoading = false;
		});
		new SetupTearDown().filter(pieQuery, $scope.sort)
		.then(function(setUpOrders){
			$scope.setUpOrders = setUpOrders.data;
			Loading.hide();
			drawPieChart(4);
			$scope.setUpLoading = false;
		});
		new homeBusiness().filter(pieQuery, $scope.sort)
		.then(function(homeBussinessOrders){
			$scope.homeBussinessOrders = homeBussinessOrders.data;
			Loading.hide();
			drawPieChart(5);
			$scope.homeBussinessLoading = false;
		});

		if ($scope.servicesByOpenDays.length==0) {

			var openServicesQuery = setOpenServicesQuery();
			new ServiceOrder().filter(openServicesQuery, $scope.sort)
			.then(function(serviceOrders){
				Loading.hide();
				$scope.servicesByOpenDays.push({
					serviceType: 'Service Order',
					invoices: serviceOrders.data
				})

			});
			new WorkOrder().filter(openServicesQuery, $scope.sort)
			.then(function(workOrders){
				Loading.hide();

				$scope.servicesByOpenDays.push({
					serviceType: 'Work Order',
					invoices: workOrders.data
				})

				drawDaysOpenChart();
			});
			new DeliveryOrder().filter(openServicesQuery, $scope.sort)
			.then(function(deliveryOrders){
				Loading.hide();

				$scope.servicesByOpenDays.push({
					serviceType: 'Delivery Order',
					invoices: deliveryOrders.data
				})

			});
			new SetupTearDown().filter(openServicesQuery, $scope.sort)
			.then(function(setUpOrders){
				Loading.hide();

				$scope.servicesByOpenDays.push({
					serviceType: 'Set Up & Teardown',
					invoices: setUpOrders.data
				})
			});
			new homeBusiness().filter(openServicesQuery, $scope.sort)
			.then(function(homeBussinessOrders){
				Loading.hide();

				$scope.servicesByOpenDays.push({
					serviceType: 'Home & Bussiness',
					invoices: homeBussinessOrders.data
				})
			});
		}
	};
	$scope.export = function(){
		var query = setQuery($scope.filter);

		new Invoice().getReport(query, queryDescription);
	};
	$scope.search();
	$scope.changeValueType('count');
});
