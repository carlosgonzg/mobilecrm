'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('homeBusinessCtrl', function ($scope, $rootScope, $location, $window, toaster, User, statusList, homeBusiness, Item, dialogs, $q, Branch, CrewCollection, ItemDefault) {
		console.log(homeBusiness)
		$scope.homeBusiness = homeBusiness;
		$scope.CrewCollection = CrewCollection.data
		$scope.Math = $window.Math;

		$scope.addedItem = [];
		$scope.homeBusiness.addedItems = $scope.homeBusiness.addedItems ? $scope.homeBusiness.addedItems : [];
		$scope.homeBusiness.removedItems = $scope.homeBusiness.removedItems ? $scope.homeBusiness.removedItems : [];
		$scope.Crewadded = []
		$scope.CrewLeaderSelected = []
		$scope.crewHeader = []
		$scope.crewHeaderAdded = []
		$scope.CrewHeaderSel = ""
		$scope.statusTech = {}
		$scope.homeBusiness.quotes = 0

		$scope.items = [];
		$scope.params = {};
		$scope.branches = [];

		$scope.list = [
			{ item: '' },
			{ item: 'Bard' },
			{ item: 'Window Unit' },
		]

		if ($scope.homeBusiness.crewHeader != undefined) {
			$scope.crewHeaderAdded = $scope.homeBusiness.crewHeader
		}

		$scope.readOnly = $rootScope.userData.role._id != 1;
		$scope.showMap = $rootScope.userData.role._id == 1;
		$scope.commentDiabled = true;

		if ($rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 5) {
			$scope.commentDiabled = false;
		}

		if ($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5) {
			$scope.homeBusiness.client = new User($rootScope.userData);
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

		var originalPhotos = $scope.homeBusiness.photos;
		var originalContacts = $scope.homeBusiness.contacts;
		var originalSiteAddress = $scope.homeBusiness.siteAddress;

		// if (!$scope.homeBusiness.siteAddressFrom) {
		// 	console.log($scope.homeBusiness.siteAddressFrom)
		// 	$scope.homeBusiness.siteAddressFrom = $scope.homeBusiness.client && $scope.homeBusiness.client.branch ? $scope.homeBusiness.client.branch.addresses[0] : {};
		// }

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
			if ($scope.homeBusiness.siteAddressFrom.address1 && $scope.homeBusiness.siteAddress.address1) {
				var distance = getDistance($scope.homeBusiness.siteAddress, $scope.homeBusiness.siteAddressFrom);
				// $scope.homeBusiness.siteAddress.distanceFrom = $scope.homeBusiness.siteAddressFrom.address1 && $scope.homeBusiness.siteAddress.address1 ? distance : 0;
			}
		}

		$scope.$watch("homeBusiness.siteAddress.distanceFrom", function (newValue, oldValue) {
			for (var row = 0; row < $scope.homeBusiness.items.length; row++) {
				console.log($scope.homeBusiness.items[row]._id)
				if ($scope.homeBusiness.items[row]._id == 253) {
					$scope.homeBusiness.items[row].quantity = Number(newValue);
					console.log(4777)
				}
			}
		});
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

					if (status === "OK" && response.rows[0].elements[0].status != "ZERO_RESULTS") {
						result = response.rows[0].elements[0].distance.value;
					} else {
						result = 0;
					}

					if ($scope.homeBusiness.siteAddressFrom && $scope.homeBusiness.siteAddress) {

						$scope.homeBusiness.siteAddress.distanceFrom = $scope.homeBusiness.siteAddressFrom.address1 && $scope.homeBusiness.siteAddress.address1 ? parseFloat((result * 0.00062137).toFixed(2)) : 0;
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
			var p1coord = new google.maps.LatLng($scope.homeBusiness.siteAddressFrom.latitude, $scope.homeBusiness.siteAddressFrom.longitude);
			var p2coord = new google.maps.LatLng($scope.homeBusiness.siteAddress.latitude, $scope.homeBusiness.siteAddress.longitude);

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

				if (!$scope.homeBusiness.siteAddressFrom) {
					$scope.homeBusiness.siteAddressFrom = $scope.homeBusiness.client.branch ? $scope.homeBusiness.client.branch.addresses[0] : {};
				}
			}

			if (homeBusiness.client == undefined) {
				$scope.homeBusiness.items = [];
			} else {
				if ($scope.homeBusiness.client._id) {
					var Serv = false
					if ($scope.homeBusiness.quotes > 0) {
						for (var row = 0; row < $scope.homeBusiness.items.length; row++) {
							var code = $scope.homeBusiness.items[row].code;
							if (ItemDefault.data[0].code == code) {
								Serv = true;
							}
						}
						if (Serv == false) {
							$scope.homeBusiness.items.unshift(ItemDefault.data[0]);
						}
					}
				}
			}
		};

		$scope.addContact = function () {
			$scope.homeBusiness.contacts.push({})
			$scope.changed("Contact")
		};

		$scope.removeContact = function (index) {
			$scope.homeBusiness.contacts.splice(index, 1);
			$scope.changed("Contact")
		};

		$scope.addItem = function (item) {
			$scope.homeBusiness.items.unshift(item);
			item.crewLeaderCol = $scope.addedItem
			item.CrewLeaderSelected = $scope.CrewLeaderSelected;
			$scope.params.item = {};
			$scope.changed('Items');
			$scope.homeBusiness.addedItems.push(item);
		};

		$scope.removeItem = function (index, item) {
			$scope.homeBusiness.items.splice(index, 1);
			$scope.changed('Items');
			$scope.homeBusiness.removedItems.push(item);
		};

		$scope.setItem = function (item, index) {
			$scope.homeBusiness.items[index] = new Item(item);
		};

		$scope.changed = function (field) {

			if ($scope.homeBusiness._id /*&& $rootScope.userData.role._id != 1*/) {
				var isHere = false;
				$scope.homeBusiness.fieldsChanged = $scope.homeBusiness.fieldsChanged || [];
				for (var i = 0; i < $scope.homeBusiness.fieldsChanged.length; i++) {
					if ($scope.homeBusiness.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				if (!isHere) {
					$scope.homeBusiness.fieldsChanged.push({ field: field + (field === "Status" ? " - " + $scope.homeBusiness.status.description : ""), by: $rootScope.userData._id });
				}
			}

			if (field === "Status") {
				$scope.setNoInvoice();
			}


		};

		$scope.isChanged = function (field) {
			if ($scope.homeBusiness._id && $rootScope.userData.role._id == 1) {
				var isHere = false;
				$scope.homeBusiness.fieldsChanged = $scope.homeBusiness.fieldsChanged || [];
				for (var i = 0; i < $scope.homeBusiness.fieldsChanged.length; i++) {
					if ($scope.homeBusiness.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				return isHere ? 'changed' : '';
			}
			return '';
		};

		$scope.isDisabled = function () {
			return ($rootScope.userData.role._id != 1 && $scope.homeBusiness.status._id == 3) || $scope.userData.role._id == 5;
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
					$scope.homeBusiness.photos = $scope.homeBusiness.photos || [];
					$scope.homeBusiness.photos = $scope.homeBusiness.photos.concat(urls)
				})
		};

		$scope.showPicture = function (index) {
			$scope.homeBusiness.showPicture(index);
		};

		$scope.removePhoto = function (index) {
			$scope.homeBusiness.photos.splice(index, 1);
		};

		$scope.addItemCollection = function () {
			var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.homeBusiness.client });
			dialog.result
				.then(function (res) {
					//add items to collection homeBusiness.items
					for (var i = 0; i < res.length; i++) {
						var isHere = -1;
						for (var j = 0; j < $scope.homeBusiness.items.length; j++) {
							if (res[i]._id == $scope.homeBusiness.items[j]._id) {
								isHere = j;
								break;
							}
						}
						if (isHere != -1 && $scope.homeBusiness.items[isHere].price == res[i].price) {
							$scope.homeBusiness.items[isHere].quantity += res[i].quantity;
						}
						else {
							$scope.homeBusiness.items.unshift(res[i]);
						}
					}

				}, function (error) {
				});
		};

		$scope.recalculate = function () {
			if ($scope.homeBusiness.siteAddress) {
				$scope.homeBusiness.siteAddress.distanceFrom = $scope.homeBusiness.siteAddressFrom && $scope.homeBusiness.siteAddressFrom.address1 && $scope.homeBusiness.siteAddress && $scope.homeBusiness.siteAddress.address1 ? getDistance($scope.homeBusiness.siteAddress, $scope.homeBusiness.siteAddressFrom) : 0;
			}

		};
		$scope.homeBusiness.fromQuotes = 0
		$scope.save = function (sendMail, sendTotech) {
			$scope.waiting = true;
			delete $scope.homeBusiness.client.account.password;
			if (sendMail) {
				$scope.homeBusiness.sendMail = true;
			} else {
				$scope.homeBusiness.sendMail = false;
			}
			if (sendTotech) {
				if ($scope.crewHeaderAdded.length == 0) {
					toaster.error('The Home & Business couldn\'t be saved, please check if some required field is empty');
					$scope.waiting = false;
					return
				}
				$scope.homeBusiness.sendTotech = true;
			} else {
				$scope.homeBusiness.sendTotech = false;
			}

			if (originalContacts != $scope.homeBusiness.contacts) {
				$scope.changed('Contacts');
			}

			if (originalPhotos != $scope.homeBusiness.photos) {
				$scope.changed('Photos');
			}
			if (originalSiteAddress.address1 != $scope.homeBusiness.siteAddress.address1) {
				$scope.changed('Site Address');
			}

			$scope.homeBusiness.save()
				.then(function (data) {
					toaster.success('The Home & Business was saved successfully');
					$location.path('homeBusinessList')
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					if (error && error.errors && error.errors.error == "The object already exists") {
						toaster.error('Home & Business # Duplicated');
					} else {
						toaster.error('The Home & Business couldn\'t be saved, please check if some required field is empty');
					}
					$scope.waiting = false;
				});
		};

		$scope.delete = function () {
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to delete?');
			dlg.result.then(function (btn) {
				$scope.homeBusiness.remove()
					.then(function () {
						toaster.success('The Home & Business was deleted successfully');
						$location.path('/homeBusinessList')
					})
					.then(function () {
						console.log(7899)
						$scope.homeBusiness.sendDelete($scope.homeBusiness)
					});
			});
		};

		$scope.export = function () {
			$scope.homeBusiness.download();
		};

		$scope.send = function () {
			$scope.homeBusiness.send();
		};

		$scope.setNoInvoice = function () {
			var array = [5, 7]
			if (!$scope.homeBusiness.invoiceNumber || $scope.homeBusiness.invoiceNumber === "Pending Invoice" || $scope.homeBusiness.invoiceNumber === "No Invoice") {
				if ($scope.homeBusiness.status._id === 5 || $scope.homeBusiness.status._id === 7) {
					$scope.homeBusiness.invoiceNumber = "No Invoice";
				} else {
					$scope.homeBusiness.invoiceNumber = "Pending Invoice";
				}
			}
		}

		if (homeBusiness.client) {
			$scope.clientChanged(homeBusiness.client);
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

								if ($scope.crewHeaderAdded.length > 0 && $scope.CrewHeaderSel.length > 0) {
									if ($scope.crewHeaderAdded[0].name == element.entity.fullName) {
										$scope.newItem = {
											name: element.entity.fullName,
											price: item.price,
											id: element._id,
											techId: element.techId
										}
										$scope.addedItem.unshift($scope.newItem);
									}
								} else {
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
				}
			} else {
				setCrewleader()
			}
		}

		$scope.changedValue = function (item) {
			$scope.CrewLeaderSelected = []
			$scope.CrewLeaderSelected = item
		}
		$scope.changedCrewLeaderValue = function (item, CrewL) {
			item.CrewLeaderSelected = CrewL;

			for (let index = 0; index < $scope.homeBusiness.items.length; index++) {
				if ($scope.homeBusiness.items[index]._id == item._id) {
					$scope.homeBusiness.items[index] = item;
					break;
				}
			}
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
			$scope.homeBusiness.crewHeader = $scope.crewHeaderAdded
			$scope.changed('Crew Leader');
		}
		$scope.crewHeaderRemove = function (index) {
			$scope.crewHeaderAdded.splice(index, 1);
			$scope.homeBusiness.crewHeader = $scope.crewHeaderAdded
			$scope.changed('Crew Leader');
		};

		$scope.setAmountToZero = function (status) {
			if (status._id == 5 || status._id == 7) {
				for (var i = 0; i < $scope.homeBusiness.items.length; i++) {
					$scope.homeBusiness.items[i].originalPrice = $scope.homeBusiness.items[i].price;
					$scope.homeBusiness.items[i].price = 0;
				}
			} else {
				for (var i = 0; i < $scope.homeBusiness.items.length; i++) {
					$scope.homeBusiness.items[i].price = $scope.homeBusiness.items[i].originalPrice ? $scope.homeBusiness.items[i].originalPrice : $scope.homeBusiness.items[i].price;
					delete $scope.homeBusiness.items[i].originalPrice;
				}
			}
		}

		$scope.addItemHeader = function () {
			var chk = document.getElementById('chkCrew').checked

			if (chk == true) {
				$scope.CrewHeaderSel = $scope.crewHeaderAdded[0].name
			} else {
				$scope.CrewHeaderSel = []
			}
		}

		$scope.showHistory = function () {
			var dialog = dialogs.create('views/historyModal.html', 'HistoryModalCtrl', {
				unitno: $scope.homeBusiness.unitno,
				_id: $scope.homeBusiness._id
			});
			dialog.result
				.then(function (res) {
				});
		};
	});

