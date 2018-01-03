angular.module('MobileCRMApp')
    .directive('serialRoute', function ($compile) {    
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            xtest: '@',
            ngChange: '&'
        },
        template: '<input class="form-control" placeHolder="Serial Number" id="{{xtest}}">',
        replace: true,
        require: 'ngModel',
        link: function ($scope, elem, attr, ctrl) {
            $scope.label = attr.ngModel;
            var textField = $('input', elem).
                attr('ng-model', attr.ngModel).
                val($scope.$parent.$eval(attr.ngModel));

            $compile(textField)($scope.$parent);
        }
    };
});