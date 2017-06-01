'use strict';

angular.module('MobileCRMApp')
.controller('ProfitCtrl', function ($scope, invoices) {
	console.log(invoices)
	$scope.invoices = invoices || [];
});
