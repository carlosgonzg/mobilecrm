'use strict';

angular.module('MobileCRMApp')
.controller('ProfitCtrl', function ($scope, invoices) {
	$scope.invoices = invoices.data || [];
});
