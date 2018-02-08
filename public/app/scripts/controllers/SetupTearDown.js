'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('SetupTearDownCtrl', function ($route, $scope, $rootScope, $location, $window, toaster, User, statusList, Item, SetupTearDown, dialogs, $q, Branch, CrewCollection, Invoice) {
		$scope.SetupTearDown = SetupTearDown;
		$scope.CrewCollection = CrewCollection.data
		$scope.Math = $window.Math;
		
		$scope.addedItem = [];
		$scope.SetupTearDown.addedItems = $scope.SetupTearDown.addedItems ? $scope.SetupTearDown.addedItems : [];
		$scope.SetupTearDown.removedItems = $scope.SetupTearDown.removedItems ? $scope.SetupTearDown.removedItems : [];
		$scope.Crewadded = []
		$scope.CrewLeaderSelected = []
		$scope.crewHeader = []
		$scope.crewHeaderAdded = []
		$scope.CrewHeaderSel = ""
		$scope.statusTech = {}
		$scope.SetupTearDown.quotes = 0
		$scope.SetupTearDown.initialStatus = $scope.SetupTearDown.status.description

		$scope.items = [];
		$scope.params = {};
		$scope.branches = [];

		$scope.list = [
			{ item: 'Set Up' },
			{ item: 'Tear Down' },
		]

		if ($scope.SetupTearDown.crewHeader != undefined) {
			$scope.crewHeaderAdded = $scope.SetupTearDown.crewHeader
		}

		$scope.readOnly = $rootScope.userData.role._id != 1;
		$scope.showMap = $rootScope.userData.role._id == 1;
		$scope.commentDiabled = true;

		if ($rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 5) {
			$scope.commentDiabled = false;
		}

		if ($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5) {
			$scope.SetupTearDown.client = new User($rootScope.userData);
		}
		if (!$scope.SetupTearDown._id){
		$scope.SetupTearDown.date = new Date();
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

		var originalPhotos = $scope.SetupTearDown.photos;
		var originalContacts = $scope.SetupTearDown.contacts;
		var originalSiteAddress = $scope.SetupTearDown.siteAddress;

		// if (!$scope.SetupTearDown.siteAddressFrom) {
		// 	console.log($scope.SetupTearDown.siteAddressFrom)
		// 	$scope.SetupTearDown.siteAddressFrom = $scope.SetupTearDown.client && $scope.SetupTearDown.client.branch ? $scope.SetupTearDown.client.branch.addresses[0] : {};
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
			if ($scope.SetupTearDown.siteAddressFrom.address1 && $scope.SetupTearDown.siteAddress.address1) {
				var distance = getDistance($scope.SetupTearDown.siteAddress, $scope.SetupTearDown.siteAddressFrom);
				// $scope.SetupTearDown.siteAddress.distanceFrom = $scope.SetupTearDown.siteAddressFrom.address1 && $scope.SetupTearDown.siteAddress.address1 ? distance : 0;
			}
		}

		$scope.$watch("SetupTearDown.siteAddress.distanceFrom",function(newValue,oldValue) {
			for (var row = 0; row < $scope.SetupTearDown.items.length; row++) {
				if ($scope.SetupTearDown.items[row]._id == 253) {
					$scope.SetupTearDown.items[row].quantity = Number(newValue);
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

					if ($scope.SetupTearDown.siteAddressFrom && $scope.SetupTearDown.siteAddress) {

						$scope.SetupTearDown.siteAddress.distanceFrom = $scope.SetupTearDown.siteAddressFrom.address1 && $scope.SetupTearDown.siteAddress.address1 ? parseFloat((result * 0.00062137).toFixed(2)) : 0;
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
			var p1coord = new google.maps.LatLng($scope.SetupTearDown.siteAddressFrom.latitude, $scope.SetupTearDown.siteAddressFrom.longitude);
			var p2coord = new google.maps.LatLng($scope.SetupTearDown.siteAddress.latitude, $scope.SetupTearDown.siteAddress.longitude);

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
				if ($route.current.params.id) {					
					$scope.wsFilterItem = { 'typeItem': $scope.SetupTearDown.typeItem.item };
				} else {
					$scope.wsFilterItem =  { 'typeItem': 'Set Up' };
				}

				if (!$scope.SetupTearDown.siteAddressFrom) {
					$scope.SetupTearDown.siteAddressFrom = $scope.SetupTearDown.client.branch ? $scope.SetupTearDown.client.branch.addresses[0] : {};
				}
			}
		};

		$scope.addContact = function () {
			$scope.SetupTearDown.contacts.push({})
			$scope.changed("Contact")
		};

		$scope.removeContact = function (index) {
			$scope.SetupTearDown.contacts.splice(index, 1);
			$scope.changed("Contact")
		};

		$scope.addItem = function (item) {
			$scope.SetupTearDown.items.unshift(item);
			item.crewLeaderCol = $scope.addedItem
			item.CrewLeaderSelected = $scope.CrewLeaderSelected;
			$scope.params.item = {};
			$scope.changed('Items');
			$scope.SetupTearDown.addedItems.push(item);
		};

		$scope.removeItem = function (index, item) {
			$scope.SetupTearDown.items.splice(index, 1);
			$scope.changed('Items');
			$scope.SetupTearDown.removedItems.push(item);
		};

		$scope.setItem = function (item, index) {
			$scope.SetupTearDown.items[index] = new Item(item);
		};

		$scope.changed = function (field) {
			if ($scope.SetupTearDown._id /*&& $rootScope.userData.role._id != 1*/) {
				var isHere = false;
				$scope.SetupTearDown.fieldsChanged = $scope.SetupTearDown.fieldsChanged || [];
				for (var i = 0; i < $scope.SetupTearDown.fieldsChanged.length; i++) {
					if ($scope.SetupTearDown.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				if (!isHere) {
					$scope.SetupTearDown.fieldsChanged.push({ field: field + (field === "Status" ? " - " + $scope.SetupTearDown.status.description : ""), by: $rootScope.userData._id });
				}
			}

			if (field === "Status") {
				$scope.setNoInvoice();
			}
		};

		$scope.changeItem = function (client) {	
			console.log(1)
			if (client && client.company) {
				console.log(2)
				$scope.SetupTearDown.items = []	
				console.log($scope.SetupTearDown.typeItem.item)
				if ($scope.SetupTearDown.typeItem.item == 'Set Up'){
					$scope.wsFilterItem =  { 'typeItem': 'Set Up'}
				}else{
					$scope.wsFilterItem = { 'typeItem': 'Tear Down' }
				} 
		  } 
		}

		$scope.isChanged = function (field) {
			if ($scope.SetupTearDown._id && $rootScope.userData.role._id == 1) {
				var isHere = false;
				$scope.SetupTearDown.fieldsChanged = $scope.SetupTearDown.fieldsChanged || [];
				for (var i = 0; i < $scope.SetupTearDown.fieldsChanged.length; i++) {
					if ($scope.SetupTearDown.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				return isHere ? 'changed' : ''; 
			}
			return '';
		};

		$scope.isDisabled = function () {
			return ($rootScope.userData.role._id != 1 && $scope.SetupTearDown.status._id == 3) || $scope.userData.role._id == 5;
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
					$scope.SetupTearDown.photos = $scope.SetupTearDown.photos || [];
					$scope.SetupTearDown.photos = $scope.SetupTearDown.photos.concat(urls)
				})
		};

		$scope.showPicture = function (index) {
			$scope.SetupTearDown.showPicture(index);
		};

		$scope.removePhoto = function (index) {
			$scope.SetupTearDown.photos.splice(index, 1);
		};

		$scope.addItemCollection = function () {
			var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.SetupTearDown.client });
			dialog.result
				.then(function (res) {
					//add items to collection SetupTearDown.items
					for (var i = 0; i < res.length; i++) {
						var isHere = -1;
						for (var j = 0; j < $scope.SetupTearDown.items.length; j++) {
							if (res[i]._id == $scope.SetupTearDown.items[j]._id) {
								isHere = j;
								break;
							}
						}
						if (isHere != -1 && $scope.SetupTearDown.items[isHere].price == res[i].price) {
							$scope.SetupTearDown.items[isHere].quantity += res[i].quantity;
						}
						else {
							$scope.SetupTearDown.items.unshift(res[i]);
						}
					}

				}, function (error) {
				});
		};

		$scope.recalculate = function () {
			if ($scope.SetupTearDown.siteAddress) {
				$scope.SetupTearDown.siteAddress.distanceFrom = $scope.SetupTearDown.siteAddressFrom && $scope.SetupTearDown.siteAddressFrom.address1 && $scope.SetupTearDown.siteAddress && $scope.SetupTearDown.siteAddress.address1 ? getDistance($scope.SetupTearDown.siteAddress, $scope.SetupTearDown.siteAddressFrom) : 0;
			}

		};
		$scope.SetupTearDown.fromQuotes = 0
		$scope.save = function (sendMail, sendTotech) {
			$scope.waiting = true;
			delete $scope.SetupTearDown.client.account.password;
			if (sendMail) {
				$scope.SetupTearDown.sendMail = true;
			} else {
				$scope.SetupTearDown.sendMail = false;
			}
			if ($scope.SetupTearDown.tor == '') {
				toaster.error('The Set Up # can not be empty');
				angular.element('#tor').css('border', '1px solid red');
				return
			} else {
				angular.element('#tor').css('border', '1px #CCCCCC solid');
			}
			if ($scope.SetupTearDown.unitSize == undefined || $scope.SetupTearDown.unitSize == '') {
				toaster.error('The Unit Size can not be empty');
				angular.element('#unitSize').css('border', '1px solid red');
				return
			} else {
				angular.element('#unitSize').css('border', '1px #CCCCCC solid');
			}

			if ($scope.SetupTearDown.typeItem.item == undefined) {
				toaster.error('The Service Type can not be empty');
				angular.element('#category').css('border', '1px solid red');
				return
			} else {
				angular.element('#category').css('border', '1px #CCCCCC solid');
			}
			var had = false
			for (let index = 0; index < $scope.SetupTearDown.contacts.length; index++) {
				if ( $scope.SetupTearDown.contacts[index] && $scope.SetupTearDown.contacts[index].name !=''){
					had = true
					break
				}
			}
			if (had == false){
				toaster.error('You must add a contact.');
				return
			}

			if (sendTotech) {
				if ($scope.crewHeaderAdded.length == 0) {
					toaster.error('The Setup & TearDown couldn\'t be saved, please check if some required field is empty');
					$scope.waiting = false;
					return
				}
				$scope.SetupTearDown.sendTotech = true;
			} else {
				$scope.SetupTearDown.sendTotech = false;
			}
			if ($scope.SetupTearDown.date == undefined) {
				toaster.error('The Date can not be empty');
				angular.element('#date').css('border', '1px solid red');
				return
			} else {
				angular.element('#date').css('border', '1px #CCCCCC solid');
			}

			if (originalContacts != $scope.SetupTearDown.contacts) {
				$scope.changed('Contacts');
			}

			if (originalPhotos != $scope.SetupTearDown.photos) {
				$scope.changed('Photos');
			}
			if (originalSiteAddress.address1 != $scope.SetupTearDown.siteAddress.address1) {
				$scope.changed('Site Address');
			}
			$scope.ControlstatusChanged()
			$scope.SetupTearDown.save()
				.then(function (data) {
					toaster.success('The Set Up & TearDown was saved successfully');
					$location.path('SetupTearDownList')
					$scope.waiting = false;
					$scope.updateDoc()
				},
				function (error) {
					console.log(error);
					if (error && error.errors && error.errors.error == "The object already exists") {
						toaster.error('Set Up # Duplicated');
					} else {
						toaster.error('The Set Up & TearDown couldn\'t be saved, please check if some required field is empty');
					}
					$scope.waiting = false;
				});
		};

		$scope.delete = function () {
			$scope.SetupTearDelete = $scope.SetupTearDown
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to delete?');
			dlg.result.then(function (btn) {
				$scope.SetupTearDown.remove()
					.then(function () {
						toaster.success('The Set Up & TearDown was deleted successfully');
						$location.path('/SetupTearDownList')
						$scope.updateDoc()
					})
					.then(function () {
						console.log(7899)
						$scope.SetupTearDown.sendDelete($scope.SetupTearDelete)
					});
			});
		};

		$scope.export = function () {
			$scope.SetupTearDown.download();
		};

		$scope.send = function () {
			$scope.SetupTearDown.send();
		};

		$scope.setNoInvoice = function () {
			var array = [5, 7]
			if (!$scope.SetupTearDown.invoiceNumber || $scope.SetupTearDown.invoiceNumber === "Pending Invoice" || $scope.SetupTearDown.invoiceNumber === "No Invoice") {
				if ($scope.SetupTearDown.status._id === 5 || $scope.SetupTearDown.status._id === 7) {
					$scope.SetupTearDown.invoiceNumber = "No Invoice";
				} else {
					$scope.SetupTearDown.invoiceNumber = "Pending Invoice";
				}
			}
		}

		if (SetupTearDown.client) {
			$scope.clientChanged(SetupTearDown.client);
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

								if ($scope.crewHeaderAdded.length > 0 && $scope.CrewHeaderSel.length > 0 ) {
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

			for (let index = 0; index < $scope.SetupTearDown.items.length; index++) {
				if ($scope.SetupTearDown.items[index]._id == item._id) {
					$scope.SetupTearDown.items[index] = item;
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
			$scope.SetupTearDown.crewHeader = $scope.crewHeaderAdded
			$scope.changed('Crew Leader');
		}
		$scope.crewHeaderRemove = function (index) {
			$scope.crewHeaderAdded.splice(index, 1);
			$scope.SetupTearDown.crewHeader = $scope.crewHeaderAdded
			$scope.changed('Crew Leader');	
		};

		$scope.setAmountToZero = function (status) {
			if (status._id == 5 || status._id == 7) {
				for (var i=0; i<$scope.SetupTearDown.items.length; i++) {
					$scope.SetupTearDown.items[i].originalPrice = $scope.SetupTearDown.items[i].price;
					$scope.SetupTearDown.items[i].price = 0;
				}
			} else {
				for (var i=0; i<$scope.SetupTearDown.items.length; i++) {
					$scope.SetupTearDown.items[i].price = $scope.SetupTearDown.items[i].originalPrice ? $scope.SetupTearDown.items[i].originalPrice : $scope.SetupTearDown.items[i].price; 
					delete $scope.SetupTearDown.items[i].originalPrice;
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
				unitno: $scope.SetupTearDown.unitno,
				_id: $scope.SetupTearDown._id
			});
			dialog.result
				.then(function (res) {
				});
		};

		$scope.updateDoc = function () {
			if ($scope.SetupTearDown.tor) {
				new Invoice().filter({ "tor": $scope.SetupTearDown.tor })
					.then(function (result) {
						_.map(result.data, function (obj) {
							$scope.Invoice = obj
							$scope.Invoice.originalShipDate = $scope.SetupTearDown.originalShipDate
							$scope.Invoice.pono = $scope.SetupTearDown.pono
							$scope.Invoice.save()
						});
					})
			}
		}

		$scope.ControlstatusChanged = function () {
			if ($scope.SetupTearDown._id) {
				var status = [{ status: $scope.SetupTearDown.initialStatus }, { status: $scope.SetupTearDown.status.description }]

				$scope.SetupTearDown.ControlstatusChanged = status
			}
		}
	});

