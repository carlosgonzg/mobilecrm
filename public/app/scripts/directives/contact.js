angular.module('MobileCRMApp')
.directive('contactModel', function (List) {
	return {
		templateUrl : 'views/directives/contact.html',
		restrict : 'E',
		scope : {
			ngModel : '=',
			hideLabels: '='
		},
		controller : function ($scope, List) {
			$scope.ngModel = $scope.ngModel || {};
			var Contact = function(contact){
				this.name = contact.name || ''
				this.phoneType = contact.phoneType || {};
				this.number = contact.number || '';
			};
			$scope.phoneTypes = [];
			List.get('phoneType')
			.then(function(res){
				$scope.phoneTypes = res;
			});
			$scope.ngModel = new Contact($scope.ngModel);
		}
	};
});
