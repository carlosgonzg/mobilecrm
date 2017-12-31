/* angular.module('MobileCRMApp')
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
}); */

angular.module('MobileCRMApp')
//Directive that returns an element which adds buttons on click which show an alert on click
  .directive("serial", function () {
  return {
    restrict: "E",
    template: "<button addbuttons>Click to add buttons</button>"
  }
});

//Directive for adding buttons on click that show an alert on click
angular.module('MobileCRMApp')
.directive("addbuttons", function ($compile) {
  return function (scope, element, attrs) {
    element.bind("click", function () {
      scope.count++;
      angular.element(document.getElementById('space-for-buttons')).append($compile("<div><button class='btn btn-default' data-alert=" + scope.count + ">Show alert #" + scope.count + "</button></div>")(scope));
    });
  };
});

//Directive for showing an alert on click
angular.module('MobileCRMApp')
.directive("alert", function () {
  return function (scope, element, attrs) {
    element.bind("click", function () {
      console.log(attrs);
      alert("This is alert #" + attrs.alert);
    });
  };
});