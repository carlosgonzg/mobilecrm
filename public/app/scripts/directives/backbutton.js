angular.module('MobileCRMApp')
.directive('backButton', function () {
  return {
    template: '<button class="btn btn-default" ng-click="goBack()"><i class="fa fa-reply"></i>&nbsp;Go Back</button>',
    restrict: 'E',
    controller: function ($scope, $window) {
		$scope.goBack = function () {
			console.log('back');
			$window.history.back();
		};
    }
  };
});