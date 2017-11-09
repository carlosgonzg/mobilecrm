'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('DeliveryOrderCtrl', function ($scope, $rootScope, $location, toaster, User, statusList, EntranceList, Item, dialogs, $q, Branch, DeliveryOrder, $timeout, ItemDefault, $route, Company) {
		$scope.DeliveryOrder = DeliveryOrder;

		Concatenate();
		console.log($scope.DeliveryOrder)

		$scope.addedItem = [];
		$scope.items = [];
		$scope.params = {};
		$scope.branches = [];
		$scope.fistLoad = 0;
		$scope.priceInitial = ItemDefault.data[0].price
		$scope.company = []

		$scope.readOnly = $rootScope.userData.role._id != 1;
		$scope.showMap = $rootScope.userData.role._id == 1;
		$scope.commentDiabled = true;

		if ($rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 6) {
			$scope.commentDiabled = false;
		}

		if ($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 6) {
			$scope.DeliveryOrder.client = new User($rootScope.userData);
		}

		if ($scope.DeliveryOrder.client.company != undefined) {
			if ($scope.DeliveryOrder.client.company.perHours != undefined) {
				$scope.company = $scope.DeliveryOrder.client.company
			}
		}

		$scope.listStatus = statusList;
		$scope.entranceList = EntranceList;
		$scope.waiting = false;

		$scope.wsClass = User;
		$scope.wsFilter = { 'role._id': 3 };
		$scope.wsFields = [{
			field: 'entity.fullName',
			label: 'Name',
			type: 'text',
			show: true
		}, {
			field: 'account.email',
			label: 'Email',
			type: 'text',
			show: true
		}, {
			field: 'company.entity.name',
			label: 'Company',
			type: 'text',
			show: true
		}, {
			field: 'branch.name',
			label: 'Branch',
			type: 'text',
			show: true
		}
		];
		$scope.addresses = [];
		var address = {};

		var originalPhotos = $scope.DeliveryOrder.photos;
		var originalContacts = $scope.DeliveryOrder.contacts;
		var originalSiteAddress = $scope.DeliveryOrder.siteAddress;

		//	$scope.DeliveryOrder.siteAddressFrom = $scope.DeliveryOrder.client && $scope.DeliveryOrder.client.branch ? $scope.DeliveryOrder.client.branch.addresses[0] : {};

		/* 		$scope.getBranches = function () {
					$scope.branches = [];
					new Branch().filter({})
						.then(function (res) {
							$scope.branches = res.data;
							for (var i = 0; i < $scope.branches.length; i++) {
								if ($scope.branches[i].addresses.length > 0) {
									address = $scope.branches[i].addresses[0];
									address.addressString = $scope.branches[i].company.entity.name + " - " + (address ? (address.city.description ? address.city.description + " - " : "") + address.address1 + (address.state.id ? ", " + address.state.id : "") : "");
									$scope.addresses.push(address)
								}
							}
						});
				}; */

		$scope.recalculate = function () {
			if ($scope.DeliveryOrder.siteAddressFrom) {
				if ($scope.DeliveryOrder.siteAddressFrom.address1 && $scope.DeliveryOrder.siteAddress.address1) {
					var distance = getDistance($scope.DeliveryOrder.siteAddress, $scope.DeliveryOrder.siteAddressFrom);

					for (var row = 0; row < $scope.DeliveryOrder.items.length; row++) {
						var id = $scope.DeliveryOrder.items[row]._id;
						if (id == 805) {
							var miles = $scope.DeliveryOrder.siteAddress.distanceFrom

							$scope.DeliveryOrder.items[row].quantity = miles
						}

					}
				}
			}
		}

		var getDistance1 = function (p1, p2) {
			var p1 = new google.maps.LatLng(p1.latitude, p1.longitude);
			var p2 = new google.maps.LatLng(p2.latitude, p2.longitude);
			var distance = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
			return parseFloat((distance * 0.00062137).toFixed(2));
		}

		var getDistance = function (p1, p2) {
			var d = $q.defer();
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
					if (status === "OK" && response.rows[0].elements[0].status != "ZERO_RESULTS") {
						result = response.rows[0].elements[0].distance.value;
					} else {
						result = 0;
					}

					SetAddress();

					if ($scope.DeliveryOrder.siteAddressFrom && $scope.DeliveryOrder.siteAddress) {

						$scope.DeliveryOrder.siteAddress.distanceFrom = $scope.DeliveryOrder.siteAddressFrom.address1 && $scope.DeliveryOrder.siteAddress.address1 ? parseFloat((result * 0.00062137).toFixed(2)) : 0;
						initMap(p1coord, p2coord);
						$scope.$apply();

						for (var row = 0; row < $scope.DeliveryOrder.items.length; row++) {
							var id = $scope.DeliveryOrder.items[row]._id;
							if (id == 805) {
								var miles = $scope.DeliveryOrder.siteAddress.distanceFrom

								$scope.DeliveryOrder.items[row].quantity = miles
							}
						}

					}

					d.resolve(parseFloat((result * 0.00062137).toFixed(2)))
				});

			return d.promise;
		};

		function initMap(p1, p2) {
			var markerArray = [];

			// Instantiate a directions service.
			var directionsService = new google.maps.DirectionsService;

			// Create a map and center it on Manhattan.
			var map = new google.maps.Map(document.getElementById('map'), {
				zoom: 6,
				center: {
					lat: 28.39788010000001,
					lng: -81.33288979999998
				}
			});

			// Create a renderer for directions and bind it to the map.
			var directionsDisplay = new google.maps.DirectionsRenderer({ map: map });

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
			var p1coord = new google.maps.LatLng($scope.DeliveryOrder.siteAddressFrom.latitude, $scope.DeliveryOrder.siteAddressFrom.longitude);
			var p2coord = new google.maps.LatLng($scope.DeliveryOrder.siteAddress.latitude, $scope.DeliveryOrder.siteAddress.longitude);

			directionsService.route({
				origin: p1coord,
				destination: p2coord,
				travelMode: 'DRIVING'
			}, function (response, status) {
				// Route the directions and pass the response to a function to create
				// markers for each step.
				if (status === 'OK') {
					document.getElementById('warnings-panel').innerHTML =
						'<b>' + response.routes[0].warnings + '</b>';
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
			google.maps.event.addListener(marker, 'click', function () {
				// Open an info window when the marker is clicked on, containing the text
				// of the step.
				stepDisplay.setContent(text);
				stepDisplay.open(map, marker);
			});
		}

		$scope.wsClassItem = Item;
		$scope.wsFilterItem = $rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 6 ? { 'companies._id': $rootScope.userData.company._id } : {};
		$scope.wsFieldsItem = [{
			label: 'Code',
			field: 'code',
			type: 'text',
			show: true
		}, {
			label: 'Description',
			field: 'description',
			type: 'text',
			show: true
		}, {
			label: 'Part',
			field: 'part',
			type: 'text',
			show: true
		}, {
			label: 'Unit of Measure',
			field: 'unitOfMeasure',
			type: 'text',
			show: true
		}, {
			label: 'Price',
			field: 'price',
			type: 'currency',
			show: true
		}
		];

		$scope.clientChanged = function (client) {

			if (client) {
				new Company().filter({ _id: client.company._id })
					.then(function (res) {
						_.map(res.data, function (obj) {
							$scope.company = obj
							console.log(1)
							$scope.LoadItemDefault();
						})
					})
			}

			if (client && client.company) {
				$scope.wsFilterItem = $rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 6 ? { 'companies._id': $rootScope.userData.company._id } : { 'companies._id': client.company._id };

				$scope.DeliveryOrder.siteAddressFrom = $scope.DeliveryOrder.client.branch ? $scope.DeliveryOrder.client.branch.addresses[0] : {};
			}

			if (client == undefined) {
				$scope.DeliveryOrder.items = []
				$scope.ItemDefault = []
			} else {
				if ($scope.DeliveryOrder.client._id) {
					console.log(2)
					$scope.LoadItemDefault();
				}
			}
		};

		$scope.addContact = function () {
			$scope.DeliveryOrder.contacts.push({})
			$scope.changed("contact")
		};

		$scope.removeContact = function (index) {
			$scope.DeliveryOrder.contacts.splice(index, 1);
			$scope.changed("contact")
		};

		$scope.addItem = function (item) {
			$scope.DeliveryOrder.items.unshift(item);
			if ($scope.CrewLeaderSelected.length > 0) {
				item.crewLeaderCol = $scope.CrewLeaderSelected[0]
			}

			$scope.params.item = {};
			$scope.changed('items');
		};

		$scope.removeItem = function (index) {
			$scope.DeliveryOrder.items.splice(index, 1);
			$scope.changed('items');
		};

		$scope.setItem = function (item, index) {
			$scope.DeliveryOrder.items[index] = new Item(item);
		};

		$scope.changed = function (field) {

			if ($scope.DeliveryOrder._id /*&& $rootScope.userData.role._id != 1*/) {
				var isHere = false;
				$scope.DeliveryOrder.fieldsChanged = $scope.DeliveryOrder.fieldsChanged || [];
				for (var i = 0; i < $scope.DeliveryOrder.fieldsChanged.length; i++) {
					if ($scope.DeliveryOrder.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				if (!isHere) {
					$scope.DeliveryOrder.fieldsChanged.push({ field: field + (field === "Status" ? " - " + $scope.DeliveryOrder.status.description : ""), by: $rootScope.userData._id });
				}
			}
		};

		$scope.isChanged = function (field) {
			if ($scope.DeliveryOrder._id && $rootScope.userData.role._id == 1) {
				var isHere = false;
				$scope.DeliveryOrder.fieldsChanged = $scope.DeliveryOrder.fieldsChanged || [];
				for (var i = 0; i < $scope.DeliveryOrder.fieldsChanged.length; i++) {
					if ($scope.DeliveryOrder.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				return isHere ? 'changed' : '';
			}
			return '';
		};

		$scope.isDisabled = function () {
			return $rootScope.userData.role._id > 1;
		};

		$scope.uploadFiles = function (files) {
			$scope.files = angular.copy(files)
			function getBase64(file) {
				var d = $q.defer();
				var reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = function () {
					d.resolve({
						url: reader.result,
						name: file.name,
						type: file.type,
						isNew: true
					});
				};
				reader.onerror = function (error) {
					d.reject(error);
				};
				return d.promise;
			}
			var promises = [];
			for (var i = 0; i < files.length; i++) {
				promises.push(getBase64(files[i]))
			}
			$q.all(promises)
				.then(function (urls) {
					$scope.DeliveryOrder.photos = $scope.DeliveryOrder.photos || [];
					$scope.DeliveryOrder.photos = $scope.DeliveryOrder.photos.concat(urls)
				})
		};

		$scope.uploadPDF = function (files) {
			$scope.files = angular.copy(files)
			function getBase64(file) {
				var d = $q.defer();
				var reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = function () {
					d.resolve({
						url: reader.result,
						name: file.name,
						type: file.type,
						isNew: true
					});
				};
				reader.onerror = function (error) {
					d.reject(error);
				};
				return d.promise;
			}
			var promises = [];
			for (var i = 0; i < files.length; i++) {
				promises.push(getBase64(files[i]))
			}
			$q.all(promises)
				.then(function (urls) {
					$scope.DeliveryOrder.docs = $scope.DeliveryOrder.docs || [];
					$scope.DeliveryOrder.docs = $scope.DeliveryOrder.docs.concat(urls)
				})
		};

		$scope.downloadFile = function (index) {
			console.log(index)
		};

		$scope.showPicture = function (index) {
			$scope.DeliveryOrder.showPicture(index);
		};

		$scope.removePhoto = function (index) {
			$scope.DeliveryOrder.photos.splice(index, 1);
		};
		$scope.removeDoc = function (index) {
			$scope.DeliveryOrder.docs.splice(index, 1);
		};

		$scope.addItemCollection = function () {
			var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.DeliveryOrder.client });
			dialog.result
				.then(function (res) {
					//add items to collection DeliveryOrder.items
					for (var i = 0; i < res.length; i++) {
						var isHere = -1;
						for (var j = 0; j < $scope.DeliveryOrder.items.length; j++) {
							if (res[i]._id == $scope.DeliveryOrder.items[j]._id) {
								isHere = j;
								break;
							}
						}
						if (isHere != -1 && $scope.DeliveryOrder.items[isHere].price == res[i].price) {
							$scope.DeliveryOrder.items[isHere].quantity += res[i].quantity;
						}
						else {
							$scope.DeliveryOrder.items.unshift(res[i]);
						}
					}

				}, function (error) {
				});
		};

		$scope.save = function (sendMail) {
			$scope.waiting = true;
			$scope.DeliveryOrder.sendMail = false;

			if (sendMail) {
				$scope.DeliveryOrder.sendMail = true;
			}

			if (originalContacts != $scope.DeliveryOrder.contacts) {
				$scope.changed('contacts');
			}

			if (originalPhotos != $scope.DeliveryOrder.photos) {
				$scope.changed('photos');
			}

			if (originalSiteAddress.address1 != $scope.DeliveryOrder.siteAddress.address1) {
				$scope.changed('siteAddress');
			}

			for (var row = 0; row < $scope.DeliveryOrder.items.length; row++) {
				var id = $scope.DeliveryOrder.items[row]._id;

				if (id == 805 && $scope.DeliveryOrder.siteAddress.distanceFrom == 0) {
					toaster.error('The service miles can not be 0 or empty');
					$scope.waiting = false;
					return;
				}
				if (id == 805) {
					$scope.DeliveryOrder.items[row].quantity = DeliveryOrder.siteAddress.distanceFrom
				}
			}

			if (!$route.current.params.id) { $scope.DeliveryOrder.date = new Date() }

			if ($scope.DeliveryOrder.status.description == "Pending") {
				$scope.DeliveryOrder.status.description = "Waiting for Availability"
			}

			if ($scope.company) {
				$scope.DeliveryOrder.client.company = $scope.company;
			}
			
			$scope.DeliveryOrder.save()
				.then(function (data) {
					toaster.success('The Delivery Order was saved successfully');
					$location.path('DeliveryOrderList')
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					toaster.error('The Delivery Order couldn\'t be saved, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};

		$scope.delete = function () {
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to delete?');
			dlg.result.then(function (btn) {
				$scope.DeliveryOrder.remove()
					.then(function () {
						toaster.success('The service order was deleted successfully');
						$location.path('/DeliveryOrderList')
					});
			});
		};

		$scope.export = function () {
			$scope.DeliveryOrder.download();
		};

		$scope.send = function () {
			$scope.DeliveryOrder.send();
		};

		var originPoint = {};
		var placeSearch, autocomplete, map, directionsService, directionsDisplay;

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
				city: {
					id: '',
					description: ''
				},
				county: {
					id: '',
					description: ''
				},
				state: {
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
			if (place.address_components) {
				for (var i = 0; i < place.address_components.length; i++) {
					//Getting all data
					if (place.address_components[i].types.indexOf('street_number') != -1) {
						data.streetNumber = place.address_components[i].long_name
					}
					else if (place.address_components[i].types.indexOf('route') != -1) {
						data.route = place.address_components[i].long_name
					}
					else if (place.address_components[i].types.indexOf('locality') != -1) {
						data.city.id = place.address_components[i].short_name
						data.city.description = place.address_components[i].long_name
					}
					else if (place.address_components[i].types.indexOf('administrative_area_level_2') != -1) {
						data.county.id = place.address_components[i].short_name
						data.county.description = place.address_components[i].long_name
					}
					else if (place.address_components[i].types.indexOf('administrative_area_level_1') != -1) {
						data.state.id = place.address_components[i].short_name
						data.state.description = place.address_components[i].long_name
					}
					else if (place.address_components[i].types.indexOf('country') != -1) {
						data.country.id = place.address_components[i].short_name
						data.country.description = place.address_components[i].long_name
					}
					else if (place.address_components[i].types.indexOf('postal_code') != -1) {
						data.zipcode.postal = place.address_components[i].long_name
					}
					else if (place.address_components[i].types.indexOf('postal_code_suffix') != -1) {
						data.zipcode.subpostal = place.address_components[i].long_name
					}
				}
			}
			else {
				var data = {
					streetNumber: '',
					route: place.name,
					city: {
						id: 0,
						description: 'N/A'
					},
					county: {
						id: 0,
						description: 'N/A'
					},
					state: {
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

			$scope.DeliveryOrder.address1 = data.streetNumber + ' ' + data.route;
			$scope.DeliveryOrder.address2 = '';
			$scope.DeliveryOrder.city = data.city;
			$scope.DeliveryOrder.city.stateId = data.state.id;
			$scope.DeliveryOrder.county = data.county;
			$scope.DeliveryOrder.state = data.state;
			$scope.DeliveryOrder.state.country = data.country.id;
			$scope.DeliveryOrder.country = data.country;
			$scope.DeliveryOrder.zipcode = data.zipcode.postal;
			$scope.DeliveryOrder.latitude = place.geometry ? place.geometry.location.lat() : 0;
			$scope.DeliveryOrder.longitude = place.geometry ? place.geometry.location.lng() : 0;

			if (place.geometry) {
				getDistance($scope.DeliveryOrder, originPoint);
			}

			if (originPoint) {
				initMap();
			}

			$scope.$apply();
			$scope.recalculate();
		}

		$scope.geolocate = function () {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function (position) {
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

		var Address = function (address) {
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

		function initAutocomplete() {
			autocomplete = new google.maps.places.Autocomplete(
				(document.getElementById('addressFromsId')), { types: ['geocode'] });
			autocomplete.addListener('place_changed', fillInAddress);
		}

		$timeout(function () {
			//	console.log($scope.addresses)
			//	$scope.ngModel = new Address($scope.ngModel);
			initAutocomplete();
		});

		$scope.reset = function () {
			$scope.DeliveryOrder.siteAddressFrom = [];
			angular.element(document.getElementById('addressFromsId'))[0].value = "";
			DeliveryOrder.siteAddress = []
			DeliveryOrder.siteAddress.distanceFrom = 0
		}

		function SetAddress() {
			if ($scope.DeliveryOrder.city != undefined) {
				var siteAddressFrom = []

				siteAddressFrom = {
					address1: $scope.DeliveryOrder.address1,
					address2: $scope.DeliveryOrder.address2,
					city: {
						id: $scope.DeliveryOrder.city.id,
						description: $scope.DeliveryOrder.city.description,
						stateId: $scope.DeliveryOrder.city.stateId
					},
					state: {
						id: $scope.DeliveryOrder.state.id,
						description: $scope.DeliveryOrder.state.description,
						country: $scope.DeliveryOrder.state.country
					},
					country: {
						id: $scope.DeliveryOrder.country.id,
						description: $scope.DeliveryOrder.country.description
					},
					zipcode: $scope.DeliveryOrder.zipcode,
					latitude: $scope.DeliveryOrder.latitude,
					longitude: $scope.DeliveryOrder.longitude,
					distanceFrom: $scope.DeliveryOrder.distanceFrom,
					county: {
						id: $scope.DeliveryOrder.county.id,
						description: $scope.DeliveryOrder.county.description
					}
				}

				$scope.DeliveryOrder.siteAddressFrom = siteAddressFrom;
			}
		}

		function Concatenate() {
			var add = ""

			if (DeliveryOrder.siteAddressFrom != undefined) {
				if (DeliveryOrder.siteAddressFrom.address1) {
					add = DeliveryOrder.siteAddressFrom.address1 || ""
				}
				if (DeliveryOrder.siteAddressFrom.city) {
					add = add + ', ' + DeliveryOrder.siteAddressFrom.city.description;
				}
				if (DeliveryOrder.siteAddressFrom.state) {
					add = add + ', ' + DeliveryOrder.siteAddressFrom.state.id + ', ' + DeliveryOrder.siteAddressFrom.state.description
				}
			}
			DeliveryOrder.addresstr = add;

			for (var row = 0; row < $scope.DeliveryOrder.items.length; row++) {
				var id = $scope.DeliveryOrder.items[row]._id;
				if (id == 761) {
					$scope.DeliveryOrder.items[row].quantity = 0
				}
			}
		}

		$scope.LoadItemDefault = function () {
			var dMiles, hour
			dMiles = false; hour = false

			$scope.ItemDefault = ItemDefault;
			$scope.DeliveryOrder.items = []

			console.log(4)
			if ($scope.company == undefined) {
				$scope.DeliveryOrder.items.unshift($scope.ItemDefault.data[0]);
				return
			}

			if ($scope.company.perHours != undefined) { //SI ESTA DEFINIDO EN COMPANY
				if ($scope.company.perHours == true) { //SI ES POR HORA 
					console.log(1)
					if ($scope.company.perHours == true) {
						$scope.ItemDefault.data[1].price = $scope.company.costPerHours
						$scope.DeliveryOrder.items.unshift($scope.ItemDefault.data[1]);
						return;
					}
				} else { // SI NO ES POR HORA
					console.log(2)
					$scope.ItemDefault.data[0].price = $scope.company.initialCost
					$scope.DeliveryOrder.items.unshift($scope.ItemDefault.data[0]);
					return;
				}
			} else {
				if ($scope.DeliveryOrder.items.length == 0) {
					console.log(3)
					$scope.DeliveryOrder.items.unshift($scope.ItemDefault.data[0]);
				}
			}
		}

		//$scope.getBranches();
		$scope.recalculate();

		$scope.meclick = function (isopen) {
			if ($scope.fistLoad == 0) {
				angular.element(document.getElementById('addressFromsId'))[0].focus();
			}
		}
		$scope.melost = function () {
			console.log($scope.fistLoad)
			if ($scope.fistLoad == 0) {
				angular.element(document.getElementById('lostIdFocus'))[0].focus();
				$scope.fistLoad = 1;
			}
		}

		//$scope.LoadItemDefault()
	});

