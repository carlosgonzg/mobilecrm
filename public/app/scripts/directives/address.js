angular.module('MobileCRMApp')
.directive('addressModel', function () {
  return {
    templateUrl: 'views/directives/address.html',
    restrict: 'E',
    scope:{
			ngModel: '='
		},
		controller: function ($scope, Country, State, City) {
			$scope.ngModel = $scope.ngModel || {};
			var Address = function(address){
				this.branch = address.branch || '';
				this.address1 = address.address1 || '';
				this.address2 = address.address2 || '';
				this.city = address.city || {};
				this.state = address.state || {};
				this.country = address.country || {};
				this.zipcode = address.zipcode || '';
				this.latitude = address.latitude || 0;
				this.longitude = address.longitude || 0;
			};
			var getCountries = function(){
				$scope.countries = [];
				new Country().find({})
				.then(function(result){
					$scope.countries = result.data;
				});
			};
			$scope.ngModel = new Address($scope.ngModel);
			
			$scope.getStates = function(){
				$scope.states = [];
				new State().filter({ countryId: $scope.ngModel.country._id })
				.then(function(result){
					$scope.states = result.data;
				});
			};
			$scope.getCities = function(){
				$scope.cities = [];
				new City().filter({ stateId: $scope.ngModel.state._id })
				.then(function(result){
					$scope.cities = result.data;
				});
			};
			getCountries();
			if($scope.ngModel.country && $scope.ngModel.country._id){
				$scope.getStates();
			}
			if($scope.ngModel.state && $scope.ngModel.state._id){
				$scope.getCities();
			}
    }
  };
});