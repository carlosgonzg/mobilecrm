angular.module('MobileCRMApp')
.directive('addressModel', function () {
  return {
    templateUrl: 'views/directives/address.html',
    restrict: 'E',
    scope:{
			ngModel: '=',
			originPoint: '=',
			showMap: '=?',
			disable: '=?'
		},
		controller: function ($scope, Country, State, City, $timeout, $q) {
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
				this.distanceFrom = address.distanceFrom || 0;
				this.gndi
			};
			// var originPoint = {
			// 	latitude: 28.39788010000001,
			// 	longitude: -81.33288979999998
			// };

			var originPoint = {};

			var placeSearch, autocomplete, map, directionsService, directionsDisplay;

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
			$scope.validate = function(){
				return $scope.ngModel && ($scope.ngModel.address1 != '') && ($scope.ngModel.city && $scope.ngModel.city.id != '') && ($scope.ngModel.state && $scope.ngModel.state.id != '') && ($scope.ngModel.country && $scope.ngModel.country.id != '') && !!($scope.ngModel.zipcode != '');
			}

			function initAutocomplete() {
				autocomplete = new google.maps.places.Autocomplete(
				(document.getElementById('address1')), {types: ['geocode']});
				autocomplete.addListener('place_changed', fillInAddress);
			}

			 function initMap() {
			        var markerArray = [];

			        // Instantiate a directions service.
			        var directionsService = new google.maps.DirectionsService;

			        // Create a map and center it on Manhattan.
			        var map = new google.maps.Map(document.getElementById('map'), {
			          zoom: 6,
			          center: {lat: 28.39788010000001,
						   	   lng: -81.33288979999998}
			        });

			        // Create a renderer for directions and bind it to the map.
			        var directionsDisplay = new google.maps.DirectionsRenderer({map: map});

			        // Instantiate an info window to hold step text.
			        var stepDisplay = new google.maps.InfoWindow;

			        // Display the route between the initial start and end selections.
			        calculateAndDisplayRoute(
			            directionsDisplay, directionsService, markerArray, stepDisplay, map);
			        // Listen to change events from the start and end lists.
			        
			      }

			      function calculateAndDisplayRoute(directionsDisplay, directionsService,
			          markerArray, stepDisplay, map) {
			        // First, remove any existing markers from the map.
			        for (var i = 0; i < markerArray.length; i++) {
			          markerArray[i].setMap(null);
			        }

			        // Retrieve the start and end locations and create a DirectionsRequest using
			        // WALKING directions.
					var p1coord = new google.maps.LatLng(originPoint.latitude, originPoint.longitude);
					var p2coord = new google.maps.LatLng($scope.ngModel.latitude, $scope.ngModel.longitude);

			        directionsService.route({
			          origin: p1coord,
			          destination: p2coord,
			          travelMode: 'WALKING'
			        }, function(response, status) {
			          // Route the directions and pass the response to a function to create
			          // markers for each step.
			          if (status === 'OK') {
			            // document.getElementById('warnings-panel').innerHTML =
			            //     '<b>' + response.routes[0].warnings + '</b>';
			            directionsDisplay.setDirections(response);
			            // showSteps(response, markerArray, stepDisplay, map);
			          } else {
			            // window.alert('Directions request failed due to ' + status);
			          }
			        });
			      }

			      function showSteps(directionResult, markerArray, stepDisplay, map) {
			        // For each step, place a marker, and add the text to the marker's infowindow.
			        // Also attach the marker to an array so we can keep track of it and remove it
			        // when calculating new routes.
			        var myRoute = directionResult.routes[0].legs[0];
			        for (var i = 0; i < myRoute.steps.length; i++) {
			          var marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
			          marker.setMap(map);
			          marker.setPosition(myRoute.steps[i].start_location);
			          attachInstructionText(
			              stepDisplay, marker, myRoute.steps[i].instructions, map);
			        }
			      }

			      function attachInstructionText(stepDisplay, marker, text, map) {
			        google.maps.event.addListener(marker, 'click', function() {
			          // Open an info window when the marker is clicked on, containing the text
			          // of the step.
			          stepDisplay.setContent(text);
			          stepDisplay.open(map, marker);
			        });
			      }

			function fillInAddress() {
				// Get the place details from the autocomplete object.
				originPoint = $scope.originPoint && $scope.originPoint.latitude != 0 && $scope.originPoint.longitude != 0 ? $scope.originPoint : {
																																latitude: 28.39788010000001,
																																longitude: -81.33288979999998
																															};

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
			 	if(place.address_components){
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
				 }
				 else {
 				 	var data = {
				 		streetNumber: '',
				 		route: place.name,
				 		city:{
				 			id: 0,
				 			description: 'N/A'
				 		},
				 		county:{
				 			id: 0,
				 			description: 'N/A'
				 		},
				 		state:{
				 			id: 0,
				 			description: 'N/A'
				 		},
				 		country: {
				 			id: 0,
				 			description: 'N/A'
				 		},
				 		zipcode: {
				 			postal: 'N/A',
				 			subpostal: 'N/A'
				 		}
				 	};
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
				$scope.ngModel.latitude = place.geometry ? place.geometry.location.lat() : 0;
				$scope.ngModel.longitude = place.geometry ? place.geometry.location.lng() : 0;
				if (place.geometry) {
					getDistance($scope.ngModel, originPoint);
				}

				if (originPoint) {
					initMap();
				}

				$scope.$apply();

			}
			$timeout(function(){
				$scope.ngModel = new Address($scope.ngModel);
				initAutocomplete();
			});
			
			var rad = function(x) {
				return x * Math.PI / 180;
			};

			var getDistance = function(p1, p2) {
						//var d = $q.defer();
						var p1coord = new google.maps.LatLng(p1.latitude, p1.longitude);
						var p2coord = new google.maps.LatLng(p2.latitude, p2.longitude);
						var unitSystem = google.maps.UnitSystem.IMPERIAL;
						var service = new google.maps.DistanceMatrixService();
						var result;
						service.getDistanceMatrix(
							  {
							    origins: [p1coord],
							    destinations: [p2coord],
							    travelMode: 'DRIVING',
							    unitSystem: unitSystem,
							    avoidHighways: false,
							    avoidTolls: false,
							  }, function (response, status) {

								if (status === "OK"  && response.rows[0].elements[0].status != "ZERO_RESULTS") {
									result = response.rows[0].elements[0].distance.value;
								} else {
									result = 0;
								}
								  $scope.ngModel.distanceFrom = parseFloat((result * 0.00062137).toFixed(2)) ;
								  $scope.$apply();

								//d.resolve(parseFloat((result * 0.00062137).toFixed(2)))
							});

						return parseFloat((result * 0.00062137).toFixed(2));
			};

			var getDistance1 = function(p1, p2) {
				var p1 = new google.maps.LatLng(p1.latitude, p1.longitude);
				var p2 = new google.maps.LatLng(p2.latitude, p2.longitude);
				var distance = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

				return parseFloat((distance * 0.00062137).toFixed(2));
			};


			$scope.reset = function(){
				$scope.ngModel = new Address({});
			};

    }
  };


});