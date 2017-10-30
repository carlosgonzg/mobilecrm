'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('ServiceOrderCtrl', function ($scope, $rootScope, $location, toaster, User, statusList, serviceOrder, Item, dialogs, $q, Branch, CrewCollection, ItemDefault) {
		$scope.serviceOrder = serviceOrder;
		$scope.CrewCollection = CrewCollection.data

		$scope.addedItem = []
		$scope.Crewadded = []
		$scope.CrewLeaderSelected = []
		$scope.crewHeader = []
		$scope.crewHeaderAdded = []

		$scope.items = [];
		$scope.params = {};
		$scope.branches = [];

		if ($scope.serviceOrder.crewHeader != undefined) {
			$scope.crewHeaderAdded = $scope.serviceOrder.crewHeader
		}

		$scope.readOnly = $rootScope.userData.role._id != 1;
		$scope.showMap = $rootScope.userData.role._id == 1;
		$scope.commentDiabled = true;

		if ($rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 5) {
			$scope.commentDiabled = false;
		}

		if ($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5) {
			$scope.serviceOrder.client = new User($rootScope.userData);
		}
		$scope.listStatus = statusList;
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

		var originalPhotos = $scope.serviceOrder.photos;
		var originalContacts = $scope.serviceOrder.contacts;
		var originalSiteAddress = $scope.serviceOrder.siteAddress;

		$scope.serviceOrder.siteAddressFrom = $scope.serviceOrder.client && $scope.serviceOrder.client.branch ? $scope.serviceOrder.client.branch.addresses[0] : {};

		$scope.getBranches = function () {

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
		};

		$scope.recalculate = function () {
			if ($scope.serviceOrder.siteAddressFrom.address1 && $scope.serviceOrder.siteAddress.address1) {
				var distance = getDistance($scope.serviceOrder.siteAddress, $scope.serviceOrder.siteAddressFrom);
				console.log(distance)
				// $scope.serviceOrder.siteAddress.distanceFrom = $scope.serviceOrder.siteAddressFrom.address1 && $scope.serviceOrder.siteAddress.address1 ? distance : 0;
			}
		}

		var getDistance1 = function (p1, p2) {
			var p1 = new google.maps.LatLng(p1.latitude, p1.longitude);
			var p2 = new google.maps.LatLng(p2.latitude, p2.longitude);
			var distance = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
			return parseFloat((distance * 0.00062137).toFixed(2));
		};

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
					console.log(response);
					console.log(status)

					if (status === "OK" && response.rows[0].elements[0].status != "ZERO_RESULTS") {
						result = response.rows[0].elements[0].distance.value;
					} else {
						result = 0;
					}

					if ($scope.serviceOrder.siteAddressFrom && $scope.serviceOrder.siteAddress) {

						$scope.serviceOrder.siteAddress.distanceFrom = $scope.serviceOrder.siteAddressFrom.address1 && $scope.serviceOrder.siteAddress.address1 ? parseFloat((result * 0.00062137).toFixed(2)) : 0;
						initMap(p1coord, p2coord);
						$scope.$apply();

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
			var p1coord = new google.maps.LatLng($scope.serviceOrder.siteAddressFrom.latitude, $scope.serviceOrder.siteAddressFrom.longitude);
			var p2coord = new google.maps.LatLng($scope.serviceOrder.siteAddress.latitude, $scope.serviceOrder.siteAddress.longitude);

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
		$scope.wsFilterItem = $rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5 ? { 'companies._id': $rootScope.userData.company._id } : {};
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
			if (client && client.company) {
				$scope.wsFilterItem = $rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5 ? { 'companies._id': $rootScope.userData.company._id } : { 'companies._id': client.company._id };

				$scope.serviceOrder.siteAddressFrom = $scope.serviceOrder.client.branch ? $scope.serviceOrder.client.branch.addresses[0] : {};
			}

			if (serviceOrder.client == undefined) {
				$scope.serviceOrder.items = [];
			} else {
				if ($scope.serviceOrder.client._id) {
					var Serv, Admfeed
					Serv = false; Admfeed = false

					for (var row = 0; row < $scope.serviceOrder.items.length; row++) {
						var code = $scope.serviceOrder.items[row].code;
						if (ItemDefault.data[0].code == code) {
							Serv = true;
						}
					}
					if (Serv == false) {
						$scope.serviceOrder.items.unshift(ItemDefault.data[0]);
					}

					for (var row = 0; row < $scope.serviceOrder.items.length; row++) {
						var code = $scope.serviceOrder.items[row].code;
						if (ItemDefault.data[1].code == code) {
							Admfeed = true;
						}
					}
					if (Admfeed == false) {
						$scope.serviceOrder.items.unshift(ItemDefault.data[1]);
					}
				}
			}
		};

		$scope.addContact = function () {
			$scope.serviceOrder.contacts.push({})
			$scope.changed("contact")
		};

		$scope.removeContact = function (index) {
			$scope.serviceOrder.contacts.splice(index, 1);
			$scope.changed("contact")
		};

		$scope.addItem = function (item) {
			$scope.serviceOrder.items.unshift(item);
			if ($scope.CrewLeaderSelected.length > 0) {
				item.crewLeaderCol = $scope.CrewLeaderSelected[0]
			}

			$scope.params.item = {};
			$scope.changed('items');
		};

		$scope.removeItem = function (index) {
			$scope.serviceOrder.items.splice(index, 1);
			$scope.changed('items');
		};

		$scope.setItem = function (item, index) {
			$scope.serviceOrder.items[index] = new Item(item);
		};

		$scope.changed = function (field) {

			if ($scope.serviceOrder._id /*&& $rootScope.userData.role._id != 1*/) {
				var isHere = false;
				$scope.serviceOrder.fieldsChanged = $scope.serviceOrder.fieldsChanged || [];
				for (var i = 0; i < $scope.serviceOrder.fieldsChanged.length; i++) {
					if ($scope.serviceOrder.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				if (!isHere) {
					$scope.serviceOrder.fieldsChanged.push({ field: field + (field === "Status" ? " - " + $scope.serviceOrder.status.description : ""), by: $rootScope.userData._id });
					console.log($scope.serviceOrder.fieldsChanged)
				}
			}

			if (field === "Status") {
				$scope.setNoInvoice();
			}

			console.log(field)

		};

		$scope.isChanged = function (field) {
			if ($scope.serviceOrder._id && $rootScope.userData.role._id == 1) {
				var isHere = false;
				$scope.serviceOrder.fieldsChanged = $scope.serviceOrder.fieldsChanged || [];
				for (var i = 0; i < $scope.serviceOrder.fieldsChanged.length; i++) {
					if ($scope.serviceOrder.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				return isHere ? 'changed' : '';
			}
			return '';
		};

		$scope.isDisabled = function () {
			return ($rootScope.userData.role._id != 1 && $scope.serviceOrder.status._id == 3) || $scope.userData.role._id == 5;
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
					$scope.serviceOrder.photos = $scope.serviceOrder.photos || [];
					$scope.serviceOrder.photos = $scope.serviceOrder.photos.concat(urls)
				})
		};

		$scope.showPicture = function (index) {
			$scope.serviceOrder.showPicture(index);
		};

		$scope.removePhoto = function (index) {
			$scope.serviceOrder.photos.splice(index, 1);
		};

		$scope.addItemCollection = function () {
			var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.serviceOrder.client });
			dialog.result
				.then(function (res) {
					//add items to collection serviceOrder.items
					for (var i = 0; i < res.length; i++) {
						var isHere = -1;
						for (var j = 0; j < $scope.serviceOrder.items.length; j++) {
							if (res[i]._id == $scope.serviceOrder.items[j]._id) {
								isHere = j;
								break;
							}
						}
						if (isHere != -1 && $scope.serviceOrder.items[isHere].price == res[i].price) {
							$scope.serviceOrder.items[isHere].quantity += res[i].quantity;
						}
						else {
							$scope.serviceOrder.items.unshift(res[i]);
						}
					}

				}, function (error) {
				});
		};

		$scope.recalculate = function () {
			if ($scope.serviceOrder.siteAddress) {
				$scope.serviceOrder.siteAddress.distanceFrom = $scope.serviceOrder.siteAddressFrom && $scope.serviceOrder.siteAddressFrom.address1 && $scope.serviceOrder.siteAddress && $scope.serviceOrder.siteAddress.address1 ? getDistance($scope.serviceOrder.siteAddress, $scope.serviceOrder.siteAddressFrom) : 0;
			}
		}

		$scope.save = function (sendMail, sendTotech) {
			$scope.waiting = true;
			delete $scope.serviceOrder.client.account.password;
			if (sendMail) {
				$scope.serviceOrder.sendMail = true;
			} else {
				$scope.serviceOrder.sendMail = false;
			}
			if (sendTotech) {
				if ($scope.crewHeaderAdded.length == 0) {
					toaster.error('The Service Order couldn\'t be saved, please check if some required field is empty');
					$scope.waiting = false;
					return
				}
				$scope.serviceOrder.sendTotech = true;
			} else {
				$scope.serviceOrder.sendTotech = false;
			}

			if (originalContacts != $scope.serviceOrder.contacts) {
				$scope.changed('contacts');
			}

			if (originalPhotos != $scope.serviceOrder.photos) {
				$scope.changed('photos');
			}

			if (originalSiteAddress.address1 != $scope.serviceOrder.siteAddress.address1) {
				$scope.changed('siteAddress');
			}

			$scope.serviceOrder.save()
				.then(function (data) {
					toaster.success('The Service Order was saved successfully');
					$location.path('serviceOrderList')
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					toaster.error('The Service Order couldn\'t be saved, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};

		$scope.delete = function () {
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to delete?');
			dlg.result.then(function (btn) {
				$scope.serviceOrder.remove()
					.then(function () {
						toaster.success('The service order was deleted successfully');
						$location.path('/serviceOrderList')
					});
			});
		};

		$scope.export = function () {
			$scope.serviceOrder.download();
		};

		$scope.send = function () {
			$scope.serviceOrder.send();
		};

		$scope.setNoInvoice = function () {
			var array = [5, 7]
			if (!$scope.serviceOrder.invoiceNumber || $scope.serviceOrder.invoiceNumber === "Pending Invoice" || $scope.serviceOrder.invoiceNumber === "No Invoice") {
				if ($scope.serviceOrder.status._id === 5 || $scope.serviceOrder.status._id === 7) {
					$scope.serviceOrder.invoiceNumber = "No Invoice";
				} else {
					$scope.serviceOrder.invoiceNumber = "Pending Invoice";
				}
			}
		}

		if (serviceOrder.client) {
			$scope.clientChanged(serviceOrder.client);
		}

		$scope.getBranches();
		$scope.recalculate();

		setCrewleader()

		function setCrewleader() {
			for (var n = 0; n < $scope.CrewCollection.length; n++) {
				var item = $scope.CrewCollection[n];
				$scope.newItem = {
					name: item.entity.fullName,
					price: item.price,
					id: item._id,
					techId: item.techId
				}
				$scope.addedItem.push($scope.newItem);
				$scope.crewHeader.push($scope.newItem);
			}
		}

		$scope.getCrewleaders = function (selectedItem) {
			$scope.addedItem = []

			if (selectedItem != undefined || parseInt(selectedItem > 0)) {
				for (var index = 0; index < $scope.CrewCollection.length; index++) {
					var element = $scope.CrewCollection[index];
					if (element.CrewCollection != undefined) {

						var array = element.CrewCollection

						for (var n = 0; n < element.CrewCollection.length; n++) {
							var item = array[n];
							if (selectedItem == item.itemid) {

								$scope.newItem = {
									name: element.entity.fullName,
									price: item.price,
									id: element._id,
									techId: element.techId
								}
								$scope.addedItem.push($scope.newItem);
							}
						}
					}
				}
			} else {
				setCrewleader()
			}
		}

		$scope.changedValue = function (item) {
			$scope.CrewLeaderSelected = []
			$scope.CrewLeaderSelected.push(item);
		}

		$scope.addCrewHeader = function (item) {
			for (var index = 0; index < $scope.crewHeaderAdded.length; index++) {
				var element = $scope.crewHeaderAdded[index].name;

				if (element.indexOf(item.name) >= 0) {
					toaster.error('This item has already been added...');
					return;
				}
			}

			$scope.crewHeaderAdded.push(item);
			$scope.serviceOrder.crewHeader = $scope.crewHeaderAdded
		}
		$scope.crewHeaderRemove = function (index) {
			$scope.crewHeaderAdded.splice(index, 1);
			$scope.serviceOrder.crewHeader = $scope.crewHeaderAdded
		};

		$scope.setAmountToZero = function (status) {
			if (status._id == 5 || status._id == 7) {
				for (var i=0; i<$scope.serviceOrder.items.length; i++) {
					$scope.serviceOrder.items[i].price = 0;
				}
			}
		}
	});

