'use strict';

angular.module('MobileCRMApp')
.controller('ProfitCtrl', function ($scope, invoices) {
	$scope.invoices = invoices || [];
	$scope.getTotalIncome = function(){
		var aux = 0;
		for(var i = 0; i < invoices.length; i++){
			aux += invoices[i].totalIncome;
		}
		return aux;
	};
	$scope.getTotalExpenses = function(){
		var aux = 0;
		for(var i = 0; i < invoices.length; i++){
			aux += invoices[i].totalExpenses;
		}
		return aux;
	};
});
