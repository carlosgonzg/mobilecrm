'use strict';

angular.module('MobileCRMApp')
.controller('ProfitCtrl', function ($scope, invoices, Branch, companies, User, Invoice) {
	$scope.invoices = invoices || [];
	$scope.companies = companies.data || [];
	$scope.branches = [];
	$scope.params = {};

	$scope.wsClass = User;
	$scope.wsFilter = { 'role._id': { $ne: 1 }};
	$scope.wsFields = [{
			field : 'entity.fullName',
			label : 'Name',
			type : 'text',
			show : true
		}, {
			field : 'account.email',
			label : 'Email',
			type : 'text',
			show: true
		}, {
			field : 'company.entity.name',
			label : 'Company',
			type : 'text',
			show: true
		}, {
			field : 'branch.name',
			label : 'Branch',
			type : 'text',
			show: true
		}
	];

	$scope.invoiceTypeList = [
		{_id: 'sor', description: 'Service Order'},
		{_id: 'wor', description: 'Work Order'},
		{_id: 'dor', description: 'Delivery Order'},
		{_id: 'smo', description: 'Service Miles Only'},
		{_id: 'All', description: 'All'}
	];
	
	$scope.getBranches = function(company){
		$scope.branches = [];
		new Branch().filter({ 'company._id': company._id})
		.then(function(res){
			$scope.branches = res.data;
		});
	};

	$scope.getTotalIncome = function(){
		var aux = 0;
		for(var i = 0; i < $scope.invoices.length; i++){
			aux += $scope.invoices[i].totalIncome;
		}
		console.log(aux)
		return aux;
	};
	$scope.getTotalExpenses = function(){
		var aux = 0;
		for(var i = 0; i < $scope.invoices.length; i++){
			aux += $scope.invoices[i].totalExpenses;
		}
		return aux;
	};

	 $scope.search = function () {
	    var start = moment($scope.params.start).startOf('day');
	    var end = moment($scope.params.end).endOf('day');
	    if (start.isAfter(end)) {
	      toaster.pop('warning', 'Alerta', 'Favor verificar sus fechas');
	      return
	    }
	    var query = {
	    };

	    start = new Date(start);
	    end = new Date(end);

	    if ($scope.params.company && $scope.params.company._id) {
	      query['client.company._id'] = $scope.params.company._id;
	    }
	    if ($scope.params.branch && $scope.params.branch._id) {
	      query['client.branch._id'] = $scope.params.branch._id;
	    }

	    if ($scope.params.invoiceNumber) {
	      query['invoiceNumber'] = $scope.params.invoiceNumber;
	    }
	    if ($scope.params.client) {
	      query['client._id'] = $scope.params.client._id;
	    }
	    if ($scope.params.document) {
	      query['wor'] = $scope.params.document;
	    }

	    if ($scope.params.invoiceType) {
			if ($scope.params.invoiceType == 'sor') {
				query['sor'] = {'$exists': true}
			}
			if ($scope.params.invoiceType == 'wor') {
				query['wor'] = {'$exists': true}
			}
			if ($scope.params.invoiceType == 'dor') {
				query['dor'] = {'$exists': true}
			}
			if ($scope.params.invoiceType == 'smo') {
				query['status._id'] = 8
			}
		}


	    $scope.totalIncome = 0;
	    $scope.totalExpenses= 0;

	    new Invoice().getExpensesbyFilter(query, start, end)
	    .then(function(result) {
	    	$scope.invoices = result;
	    	$scope.totalIncome = $scope.getTotalIncome();
	  		$scope.totalExpenses = $scope.getTotalExpenses();
	    });

	  };

	  $scope.totalIncome = $scope.getTotalIncome();
	  $scope.totalExpenses = $scope.getTotalExpenses();



});
