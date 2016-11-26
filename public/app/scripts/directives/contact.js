angular.module('MobileCRMApp')
.directive('contactModel', function () {
	return {
		templateUrl : 'views/directives/contact.html',
		restrict : 'E',
		scope : {
			ngModel : '=',
			hideLabels: '='
		},
		controller : function ($scope) {
			$scope.ngModel = $scope.ngModel || {};
			var Contact = function(contact){
				this.name = contact.name || ''
				this.phoneType = contact.phoneType || {};
				this.number = contact.number || '';
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
			$scope.ngModel = new Contact($scope.ngModel);
		}
	};
});
