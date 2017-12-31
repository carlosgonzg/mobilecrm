angular.module('MobileCRMApp')
    .directive('control', function ($compile) {    
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            xtest: '@'
        },
        template: '<input class="form-control" id="{{xtest}}">',
        replace: true,
        require: 'ngModel',
        link: function ($scope, elem, attr, ctrl) {
            $scope.label = attr.ngModel;
            var textField = $('input', elem).
                attr('ng-model', attr.ngModel).
                val($scope.$parent.$eval(attr.ngModel));

            $compile(textField)($scope.$parent);
            console.log(attr.ngModel)
        }
    };
});