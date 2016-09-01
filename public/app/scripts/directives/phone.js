angular.module('MobileCRMApp')
.directive('phoneModel', function () {
	return {
		templateUrl : 'views/directives/phone.html',
		restrict : 'E',
		scope : {
			ngModel : '='
		},
		controller : function ($scope) {
			$scope.ngModel = $scope.ngModel || {};
			var Phone = function(phone){
				this.phoneType = phone.phoneType || {};
				this.number = phone.number || '';
			};
			$scope.phoneTypes = [{
					_id : 1,
					description : 'Home'
				}, {
					_id : 2,
					description : 'Mobile'
				}, {
					_id : 3,
					description : 'Work'
				}, {
					_id : 4,
					description : 'Other'
				}
			];
			$scope.ngModel = new Phone($scope.ngModel);
		}
	};
});
