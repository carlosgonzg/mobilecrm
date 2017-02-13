angular.module('MobileCRMApp')
.directive('backButton', function () {
  return {
    template: '<button class="btn btn-default"><i class="fa fa-reply" ng-click="goBack()"></i>&nbsp;Go Back</button>',
    restrict: 'E',
    controller: function ($scope, $window) {
		$scope.goBack = function () {
			console.log('back');
			$window.history.back();
		};
    }
  };
});