'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('ServiceQuotesCtrl', function ($scope, $rootScope, $location, toaster, User, serviceQuotes, Item, dialogs, $q, Branch, CrewCollection, ItemDefault, companies, ServiceOrder, WorkOrder, Company, SetupTearDown, homeBusiness) {
		$scope.serviceQuotes = serviceQuotes;

		$scope.CrewCollection = CrewCollection.data
		$scope.addedItem = []
		$scope.Crewadded = []
		$scope.CrewLeaderSelected = []
		$scope.crewHeader = []
		$scope.crewHeaderAdded = []
		$scope.CrewHeaderSel = ""
		$scope.statusTech = {}
		$scope.listCompany = companies.data;

		$scope.items = [];
		$scope.params = {};
		$scope.branches = [];

		if ($scope.serviceQuotes.approved == 1) {
			if ($scope.serviceQuotes._id) {
				if ($scope.serviceQuotes.serviceType._id == 1 && $scope.serviceQuotes.sor == 'Pending Service Order #') {
					$scope.serviceQuotes.sor = null
				}
				if ($scope.serviceQuotes.serviceType._id == 2 && $scope.serviceQuotes.wor == 'Pending Work Order #') {
					$scope.serviceQuotes.wor = null
				}
				if ($scope.serviceQuotes.serviceType._id == 3 && $scope.serviceQuotes.tor == 'Pending Set Up #') {
					$scope.serviceQuotes.tor = null
				}
				if ($scope.serviceQuotes.serviceType._id == 4 && $scope.serviceQuotes.hor == 'Pending Home & Business #') {
					$scope.serviceQuotes.hor = null
				}
			}
		}
		$scope.list = [
			{ item: 'Set Up' },
			{ item: 'Tear Down' },
		]
		$scope.listHB = [
			{ item: 'Bard' },
			{ item: 'Capacity' },
			{ item: 'Window' },
		]

		if ($scope.serviceQuotes.crewHeader != undefined) {
			$scope.crewHeaderAdded = $scope.serviceQuotes.crewHeader
		}

		$scope.readOnly = $rootScope.userData.role._id != 1;
		$scope.showMap = $rootScope.userData.role._id == 1;
		$scope.commentDiabled = true;

		if ($rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 5) {
			$scope.commentDiabled = false;
		}

		if ($rootScope.userData.role._id != 1 && $rootScope.userData.role._id != 5) {
			$scope.serviceQuotes.client = new User($rootScope.userData);
		}

		$scope.serviceTypeData = [{ _id: 1, description: 'Service Order' }, { _id: 2, description: 'Work Order' }, { _id: 3, description: 'Set up & Tear Down' }, { _id: 4, description: 'Home & Business' }]
		$scope.waiting = false;

		$scope.wsClass = User;
		$scope.filterC = { 'role._id': 3 };
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

		var originalPhotos = $scope.serviceQuotes.photos;
		var originalContacts = $scope.serviceQuotes.contacts;
		var originalSiteAddress = $scope.serviceQuotes.siteAddress;

		// if (!$scope.serviceQuotes.siteAddressFrom) {
		// 	console.log($scope.serviceQuotes.siteAddressFrom)
		// 	$scope.serviceQuotes.siteAddressFrom = $scope.serviceQuotes.client && $scope.serviceQuotes.client.branch ? $scope.serviceQuotes.client.branch.addresses[0] : {};
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
			if ($scope.serviceQuotes.siteAddressFrom.address1 && $scope.serviceQuotes.siteAddress.address1) {
				var distance = getDistance($scope.serviceQuotes.siteAddress, $scope.serviceQuotes.siteAddressFrom);
				console.log(distance)
				// $scope.serviceQuotes.siteAddress.distanceFrom = $scope.serviceQuotes.siteAddressFrom.address1 && $scope.serviceQuotes.siteAddress.address1 ? distance : 0;
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

					if ($scope.serviceQuotes.siteAddressFrom && $scope.serviceQuotes.siteAddress) {

						$scope.serviceQuotes.siteAddress.distanceFrom = $scope.serviceQuotes.siteAddressFrom.address1 && $scope.serviceQuotes.siteAddress.address1 ? parseFloat((result * 0.00062137).toFixed(2)) : 0;
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
			var p1coord = new google.maps.LatLng($scope.serviceQuotes.siteAddressFrom.latitude, $scope.serviceQuotes.siteAddressFrom.longitude);
			var p2coord = new google.maps.LatLng($scope.serviceQuotes.siteAddress.latitude, $scope.serviceQuotes.siteAddress.longitude);

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

				if (!$scope.serviceQuotes.siteAddressFrom) {
					$scope.serviceQuotes.siteAddressFrom = $scope.serviceQuotes.client.branch ? $scope.serviceQuotes.client.branch.addresses[0] : {};
				}
			}

			if ($scope.serviceQuotes.client == undefined) {
				$scope.serviceQuotes.items = [];
			} else {
				if ($scope.serviceQuotes.client._id) {
					if ($scope.serviceQuotes.serviceType._id == 1) {
						var Serv = false

						for (var row = 0; row < $scope.serviceQuotes.items.length; row++) {
							var code = $scope.serviceQuotes.items[row].code;
							if (ItemDefault.data[0].code == code) {
								Serv = true;
							}
						}
						if (Serv == false) {
							$scope.serviceQuotes.items.unshift(ItemDefault.data[0]);
						}
					}
				}
			}
			var company = new Company(client.company);
			company.quotes($scope.serviceQuotes.quotesNumber)
				.then(function (sequence) {
					$scope.serviceQuotes.quotesNumber = sequence;
				});
		};

		$scope.addContact = function () {
			$scope.serviceQuotes.contacts.push({})
			$scope.changed("contact")
		};

		$scope.removeContact = function (index) {
			$scope.serviceQuotes.contacts.splice(index, 1);
			$scope.changed("contact")
		};

		$scope.addItem = function (item) {
			$scope.serviceQuotes.items.unshift(item);
			item.crewLeaderCol = $scope.addedItem
			item.CrewLeaderSelected = $scope.CrewLeaderSelected;
			$scope.params.item = {};
		};

		$scope.removeItem = function (index) {
			$scope.serviceQuotes.items.splice(index, 1);
			$scope.changed('items');
		};

		$scope.setItem = function (item, index) {
			$scope.serviceQuotes.items[index] = new Item(item);
		};

		$scope.changed = function (field) {

			if ($scope.serviceQuotes._id /*&& $rootScope.userData.role._id != 1*/) {
				var isHere = false;
				$scope.serviceQuotes.fieldsChanged = $scope.serviceQuotes.fieldsChanged || [];
				for (var i = 0; i < $scope.serviceQuotes.fieldsChanged.length; i++) {
					if ($scope.serviceQuotes.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				if (!isHere) {
					$scope.serviceQuotes.fieldsChanged.push({ field: field + (field === "Status" ? " - " + $scope.serviceQuotes.status.description : ""), by: $rootScope.userData._id });
				}
			}
			if (field === "Status") {
				$scope.setNoInvoice();
			}
		};

		$scope.isChanged = function (field) {
			if ($scope.serviceQuotes._id && $rootScope.userData.role._id == 1) {
				var isHere = false;
				$scope.serviceQuotes.fieldsChanged = $scope.serviceQuotes.fieldsChanged || [];
				for (var i = 0; i < $scope.serviceQuotes.fieldsChanged.length; i++) {
					if ($scope.serviceQuotes.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				return isHere ? 'changed' : '';
			}
			return '';
		};

		$scope.isDisabled = function () {
			return ($rootScope.userData.role._id != 1 && $scope.serviceQuotes.status._id == 3) || $scope.userData.role._id == 5;
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
					$scope.serviceQuotes.photos = $scope.serviceQuotes.photos || [];
					$scope.serviceQuotes.photos = $scope.serviceQuotes.photos.concat(urls)
				})
		};

		$scope.showPicture = function (index) {
			$scope.serviceQuotes.showPicture(index);
		};

		$scope.removePhoto = function (index) {
			$scope.serviceQuotes.photos.splice(index, 1);
		};

		$scope.addItemCollection = function () {
			var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.serviceQuotes.client });
			dialog.result
				.then(function (res) {
					//add items to collection serviceQuotes.items
					for (var i = 0; i < res.length; i++) {
						var isHere = -1;
						for (var j = 0; j < $scope.serviceQuotes.items.length; j++) {
							if (res[i]._id == $scope.serviceQuotes.items[j]._id) {
								isHere = j;
								break;
							}
						}
						if (isHere != -1 && $scope.serviceQuotes.items[isHere].price == res[i].price) {
							$scope.serviceQuotes.items[isHere].quantity += res[i].quantity;
						}
						else {
							$scope.serviceQuotes.items.unshift(res[i]);
						}
					}

				}, function (error) {
				});
		};

		$scope.recalculate = function () {
			if ($scope.serviceQuotes.siteAddress) {
				$scope.serviceQuotes.siteAddress.distanceFrom = $scope.serviceQuotes.siteAddressFrom && $scope.serviceQuotes.siteAddressFrom.address1 && $scope.serviceQuotes.siteAddress && $scope.serviceQuotes.siteAddress.address1 ? getDistance($scope.serviceQuotes.siteAddress, $scope.serviceQuotes.siteAddressFrom) : 0;
			}
		}

		$scope.save = function (approved) {
			$scope.waiting = true;
			delete $scope.serviceQuotes.client.account.password;

			if (originalPhotos != $scope.serviceQuotes.photos) {
				$scope.changed('photos');
			}
			if ($scope.serviceQuotes.quotesNumber == undefined) {
				toaster.error('The Estimate number is required');
				return
			}
			if ($scope.serviceQuotes.customer == undefined) {
				toaster.error('The Customer is required');
				return
			}

			if (approved == 2) {
				if ($scope.serviceQuotes.serviceType._id == 1 && !$scope.serviceQuotes.sor) {
					toaster.error('Service Order Number is required');
					return
				}
				if ($scope.serviceQuotes.serviceType._id == 2 && !$scope.serviceQuotes.wor) {
					toaster.error('Work Order Number is required');
					return
				}
				console.log($scope.serviceQuotes.tor)
				if ($scope.serviceQuotes.serviceType._id == 3 && !$scope.serviceQuotes.tor) {
					toaster.error('Set Up Number is required');
					return
				}
				if ($scope.serviceQuotes.serviceType._id == 4 && !$scope.serviceQuotes.hor) {
					toaster.error('Home & Business Number is required');
					return
				}

				$scope.serviceQuotes.approved = 2
				$scope.serviceQuotes.quotesStatus = "Approved"
			}

			if ($scope.serviceQuotes.serviceType._id == 1) {
				delete $scope.serviceQuotes.wor
				delete $scope.serviceQuotes.tor
				delete $scope.serviceQuotes.hor
			} else if ($scope.serviceQuotes.serviceType._id == 2) {
				delete $scope.serviceQuotes.sor
				delete $scope.serviceQuotes.tor
				delete $scope.serviceQuotes.hor
			} else if ($scope.serviceQuotes.serviceType._id == 3) {
				delete $scope.serviceQuotes.sor
				delete $scope.serviceQuotes.wor
				delete $scope.serviceQuotes.hor
			} else if ($scope.serviceQuotes.serviceType._id == 4) {
				delete $scope.serviceQuotes.sor
				delete $scope.serviceQuotes.wor
				delete $scope.serviceQuotes.tor
				$scope.serviceQuotes.unitno = ""
				$scope.serviceQuotes.unitSize = ""
				delete $scope.serviceQuotes.typeItem
			}

			$scope.serviceQuotes.save()
				.then(function (data) {
					if (approved == 2) {
						if ($scope.serviceQuotes.serviceType._id == 1) {
							console.log(1)
							$scope.serviceOrder = new ServiceOrder($scope.serviceQuotes);
							delete $scope.serviceQuotes.wor
							delete $scope.serviceQuotes.tor
							delete $scope.serviceQuotes.hor
							$scope.serviceOrder.save()
							toaster.success('The Service Order was saved successfully');
						} else if ($scope.serviceQuotes.serviceType._id == 2) {
							console.log(2)
							$scope.workOrder = new WorkOrder($scope.serviceQuotes);
							delete $scope.serviceQuotes.sor
							delete $scope.serviceQuotes.tor
							delete $scope.serviceQuotes.hor
							$scope.workOrder.save()
							toaster.success('The Work Order was saved successfully');
						} else if ($scope.serviceQuotes.serviceType._id == 3) {
							console.log(3)
							$scope.SetupTearDown = new SetupTearDown($scope.serviceQuotes);
							delete $scope.serviceQuotes.sor
							delete $scope.serviceQuotes.wor
							delete $scope.serviceQuotes.hor
							$scope.SetupTearDown.save()
							toaster.success('The Set Up and Tear Down was saved successfully');
						} else if ($scope.serviceQuotes.serviceType._id == 4) {
							console.log(4)
							$scope.homeBusiness = new homeBusiness($scope.serviceQuotes);
							delete $scope.serviceQuotes.sor
							delete $scope.serviceQuotes.wor
							delete $scope.serviceQuotes.tor
							$scope.homeBusiness.save()
							toaster.success('The Home & Business was saved successfully');
						}
					} else {
						console.log(5)
						toaster.success('The Estimate was saved successfully');
					}
					$location.path('serviceQuotesList')
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					toaster.error('The Service couldn\'t be saved, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};
		$scope.saveSend = function () {
			$scope.waiting = true;
			delete $scope.serviceQuotes.client.account.password;

			$scope.serviceQuotes.saveSendTo = true;
			$scope.serviceQuotes.save()
				.then(function (data) {
					toaster.success('The Estimate was saved successfully');
					$scope.serviceQuotes.send();
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					toaster.error('The Estimate couldn\'t be saved and/or sent, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};
		$scope.delete = function () {
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to delete?');
			dlg.result.then(function (btn) {
				$scope.serviceQuotes.remove()
					.then(function () {
						toaster.success('The Service was deleted successfully');
						$location.path('/serviceQuotesList')
					})
					.then(function () {
						$scope.serviceQuotes.sendDelete($scope.serviceQuotes)
					});
			});
		};

		$scope.export = function () {
			$scope.serviceQuotes.download();
		};

		$scope.send = function () {
			$scope.serviceQuotes.send();
		};

		$scope.setNoInvoice = function () {
			var array = [5, 7]
			if (!$scope.serviceQuotes.invoiceNumber || $scope.serviceQuotes.invoiceNumber === "Pending Invoice" || $scope.serviceQuotes.invoiceNumber === "No Invoice") {
				if ($scope.serviceQuotes.status._id === 5 || $scope.serviceQuotes.status._id === 7) {
					$scope.serviceQuotes.invoiceNumber = "No Invoice";
				} else {
					$scope.serviceQuotes.invoiceNumber = "Pending Invoice";
				}
			}
		}

		/* 		if (serviceQuotes.client) {
					console.log($scope.serviceQuotes.items)
					$scope.clientChanged(serviceQuotes.client);
					console.log($scope.serviceQuotes.items)
				} */

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

			for (let index = 0; index < $scope.serviceQuotes.items.length; index++) {
				if ($scope.serviceQuotes.items[index]._id == item._id) {
					$scope.serviceQuotes.items[index] = item;
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
			$scope.serviceQuotes.crewHeader = $scope.crewHeaderAdded
		}
		$scope.crewHeaderRemove = function (index) {
			$scope.crewHeaderAdded.splice(index, 1);
			$scope.serviceQuotes.crewHeader = $scope.crewHeaderAdded
		};

		$scope.setAmountToZero = function (status) {
			if (status._id == 5 || status._id == 7) {
				for (var i = 0; i < $scope.serviceQuotes.items.length; i++) {
					$scope.serviceQuotes.items[i].originalPrice = $scope.serviceQuotes.items[i].price;
					$scope.serviceQuotes.items[i].price = 0;
				}
			} else {
				for (var i = 0; i < $scope.serviceQuotes.items.length; i++) {
					$scope.serviceQuotes.items[i].price = $scope.serviceQuotes.items[i].originalPrice ? $scope.serviceQuotes.items[i].originalPrice : $scope.serviceQuotes.items[i].price;
					delete $scope.serviceQuotes.items[i].originalPrice;
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
					$scope.serviceQuotes.docs = $scope.serviceQuotes.docs || [];
					$scope.serviceQuotes.docs = $scope.serviceQuotes.docs.concat(urls)
				})
		};

		$scope.serviceTypeChanged = function () {
			if ($scope.serviceQuotes.serviceType._id == 1) {
				var Serv = false
				for (var row = 0; row < $scope.serviceQuotes.items.length; row++) {
					var code = $scope.serviceQuotes.items[row].code;
					if (ItemDefault.data[0].code == code) {
						Serv = true;
					}
				}
				if (Serv == false) {
					$scope.serviceQuotes.items.unshift(ItemDefault.data[0]);
				}
			} else {
				$scope.serviceQuotes.items = [];
			}
		}
	});

