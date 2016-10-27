angular.module('MobileCRMApp')
.directive('addressModel', function () {
  return {
    templateUrl: 'views/directives/address.html',
    restrict: 'E',
    scope:{
			ngModel: '='
		},
		controller: function ($scope, Country, State, City, $timeout) {
			$scope.ngModel = $scope.ngModel || {};
			var Address = function(address){
				this.address1 = address.address1 || '';
				this.address2 = address.address2 || '';
				this.city = address.city || {};
				this.state = address.state || {};
				this.country = address.country || {};
				this.zipcode = address.zipcode || '';
				this.latitude = address.latitude || 0;
				this.longitude = address.longitude || 0;
			};

			var placeSearch, autocomplete;

			$scope.geolocate = function() {
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(function(position) {
						var geolocation = {
							lat: position.coords.latitude,
							lng: position.coords.longitude
						};
						var circle = new google.maps.Circle({
							center: geolocation,
							radius: position.coords.accuracy
						});
						autocomplete.setBounds(circle.getBounds());
					});
				}
			};

			function initAutocomplete() {
				autocomplete = new google.maps.places.Autocomplete(
				(document.getElementById('address1')), {types: ['geocode']});
				autocomplete.addListener('place_changed', fillInAddress);
			}

			function fillInAddress() {
				// Get the place details from the autocomplete object.
				var place = autocomplete.getPlace();
			 	var data = {
			 		streetNumber: '',
			 		route: '',
			 		city:{
			 			id: '',
			 			description: ''
			 		},
			 		county:{
			 			id: '',
			 			description: ''
			 		},
			 		state:{
			 			id: '',
			 			description: ''
			 		},
			 		country: {
			 			id: '',
			 			description: ''
			 		},
			 		zipcode: {
			 			postal: '',
			 			subpostal: ''
			 		}
			 	};
			 	for(var i = 0; i < place.address_components.length; i++){
			 		//Getting all data
			 		if(place.address_components[i].types.indexOf('street_number') != -1){
			 			data.streetNumber = place.address_components[i].long_name
			 		}
			 		else if(place.address_components[i].types.indexOf('route') != -1){
			 			data.route = place.address_components[i].long_name
			 		}
			 		else if(place.address_components[i].types.indexOf('locality') != -1){
			 			data.city.id = place.address_components[i].short_name
			 			data.city.description = place.address_components[i].long_name
			 		}
			 		else if(place.address_components[i].types.indexOf('administrative_area_level_2') != -1){
			 			data.county.id = place.address_components[i].short_name
			 			data.county.description = place.address_components[i].long_name
			 		}
			 		else if(place.address_components[i].types.indexOf('administrative_area_level_1') != -1){
			 			data.state.id = place.address_components[i].short_name
			 			data.state.description = place.address_components[i].long_name
			 		}
			 		else if(place.address_components[i].types.indexOf('country') != -1){
			 			data.country.id = place.address_components[i].short_name
			 			data.country.description = place.address_components[i].long_name
			 		}
			 		else if(place.address_components[i].types.indexOf('postal_code') != -1){
			 			data.zipcode.postal = place.address_components[i].long_name
			 		}
			 		else if(place.address_components[i].types.indexOf('postal_code_suffix') != -1){
			 			data.zipcode.subpostal = place.address_components[i].long_name
			 		}
			 	}
			 	$scope.ngModel.address1 = data.streetNumber + ' ' + data.route;
				$scope.ngModel.address2 = '';
				$scope.ngModel.city = data.city;
				$scope.ngModel.city.stateId = data.state.id;
				$scope.ngModel.county = data.county;
				$scope.ngModel.state = data.state;
				$scope.ngModel.state.country = data.country.id;
				$scope.ngModel.country = data.country;
				$scope.ngModel.zipcode = data.zipcode.postal;
				$scope.ngModel.latitude = place.geometry.location.lat();
				$scope.ngModel.longitude = place.geometry.location.lng();
				$scope.$apply();
				console.log($scope.ngModel)
			}
			$timeout(function(){
				$scope.ngModel = new Address($scope.ngModel);
				initAutocomplete();
			});
			
			/*
			var getCountries = function(){
				$scope.countries = [];
				new Country().find({})
				.then(function(result){
					$scope.countries = result.data;
				});
			};
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
			}*/
    }
  };
});