angular.module('MobileCRMApp')
.directive('phoneModel', function () {
	return {
		templateUrl : 'views/directives/phone.html',
		restrict : 'E',
		scope : {
			ngModel : '=',
			hideLabels: '='
		},
		controller : function ($scope, List) {
			$scope.ngModel = $scope.ngModel || {};
			var Phone = function(phone){
				this.phoneType = phone.phoneType || {};
				this.number = phone.number || '';
			};
			$scope.phoneTypes = [];
			List.get('phoneType')
			.then(function(res){
				$scope.phoneTypes = res;
			});
			$scope.ngModel = new Phone($scope.ngModel);
		}
	};
});
