'use strict';

/**
 * @ngdoc function
 * @name MobileCRMApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the MobileCRMApp
 */
angular.module('MobileCRMApp')
	.controller('WorkOrderCtrl', function ($scope, $rootScope, $location, toaster, User, statusList, workOrder, Item, dialogs, $q, Branch, CrewCollection, ItemDefault) {
		$scope.workOrder = workOrder;
		$scope.CrewCollection = CrewCollection.data

		$scope.addedItem = []
		$scope.Crewadded = []
		$scope.CrewLeaderSelected = []
		$scope.SendToTechShow = false;
		$scope.crewHeader = []
		$scope.crewHeaderAdded = []

		$scope.items = [];
		$scope.params = {};
		$scope.readOnly = $rootScope.userData.role._id != 1;
		$scope.commentDiabled = true;

		if ($rootScope.userData.role._id == 1 || $rootScope.userData.role._id == 5) {
			$scope.commentDiabled = false;
		}

		if ($scope.workOrder.crewHeader != undefined) {
			$scope.crewHeaderAdded = $scope.workOrder.crewHeader
		}

		if ($rootScope.userData.role._id != 1) {
			$scope.workOrder.client = new User($rootScope.userData);
		}
		$scope.waiting = false;
		$scope.listStatus = statusList;
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

		$scope.wsClassItem = Item;
		$scope.wsFilterItem = $rootScope.userData.role._id != 1 ? { 'companies._id': $rootScope.userData.company._id } : {};
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
			if (client && client.company)
				$scope.wsFilterItem = $rootScope.userData.role._id != 1 ? { 'companies._id': $rootScope.userData.company._id } : { 'companies._id': client.company._id };

			if (client && client.branch) {
				new Branch().filter({ _id: client.branch._id })
					.then(function (result) {
						if (result.data[0].addresses && result.data[0].addresses.length > 0)
							$scope.workOrder.siteAddress = angular.copy(result.data[0].addresses[0]);
					})
					.catch(function () {
						$scope.workOrder.siteAddress = angular.copy(client.company.address);
					})
			}
			if (workOrder.client == undefined) {
				$scope.workOrder.items = []
			} else {
				if (workOrder.client._id) {
					for (var row = 0; row < $scope.workOrder.items.length; row++) {
						var code = $scope.workOrder.items[row].code;
						if (ItemDefault.data[0].code == code) {
							return
						}
					}
					$scope.workOrder.items.unshift(ItemDefault.data[0]);
				}
			}	
		};

		$scope.addContact = function () {
			$scope.workOrder.contacts.push({})
		};

		$scope.removeContact = function (index) {
			$scope.workOrder.contacts.splice(index, 1);
		};

		$scope.addItem = function (item) {
			$scope.workOrder.items.unshift(item);
			if ($scope.CrewLeaderSelected.length > 0) {
				item.crewLeaderCol = $scope.CrewLeaderSelected[0]
			}
			$scope.params.item = {};
			$scope.CrewLeaderSelected = {};
		};

		$scope.removeItem = function (index) {
			$scope.workOrder.items.splice(index, 1);
		};

		$scope.setItem = function (item, index) {
			$scope.workOrder.items[index] = new Item(item);
		};

		$scope.addItemCollection = function () {
			var dialog = dialogs.create('views/addItemCollection.html', 'AddItemCollectionCtrl', { client: $scope.workOrder.client });
			dialog.result
				.then(function (res) {
					//add items to collection workOrder.items
					for (var i = 0; i < res.length; i++) {
						var isHere = -1;
						for (var j = 0; j < $scope.workOrder.items.length; j++) {
							if (res[i]._id == $scope.workOrder.items[j]._id) {
								isHere = j;
								break;
							}
						}
						if (isHere != -1 && $scope.workOrder.items[isHere].price == res[i].price) {
							$scope.workOrder.items[isHere].quantity += res[i].quantity;
						}
						else {
							$scope.workOrder.items.unshift(res[i]);
						}
					}
				}, function (error) {
				});
		};

		$scope.changed = function (field) {
			if ($scope.workOrder._id && $rootScope.userData.role._id != 1) {
				var isHere = false;
				$scope.workOrder.fieldsChanged = $scope.workOrder.fieldsChanged || [];
				for (var i = 0; i < $scope.workOrder.fieldsChanged.length; i++) {
					if ($scope.workOrder.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				if (!isHere) {
					$scope.workOrder.fieldsChanged.push({ field: field, by: $rootScope.userData._id });
				}
			}
		};

		$scope.isChanged = function (field) {
			if ($scope.workOrder._id && $rootScope.userData.role._id == 1) {
				var isHere = false;
				$scope.workOrder.fieldsChanged = $scope.workOrder.fieldsChanged || [];
				for (var i = 0; i < $scope.workOrder.fieldsChanged.length; i++) {
					if ($scope.workOrder.fieldsChanged[i].field == field) {
						isHere = true;
						break;
					}
				}
				return isHere ? 'changed' : '';
			}
			return '';
		};

		$scope.isDisabled = function () {
			return $rootScope.userData.role._id != 1 && $scope.workOrder.status._id == 3;
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
					$scope.workOrder.photos = $scope.workOrder.photos || [];
					$scope.workOrder.photos = $scope.workOrder.photos.concat(urls)
				})
		};

		$scope.showPicture = function (index) {
			$scope.workOrder.showPicture(index);
		};

		$scope.removePhoto = function (index) {
			$scope.workOrder.photos.splice(index, 1);
		};

		$scope.save = function (sendMail, sendTotech) {
			$scope.waiting = true;

			delete $scope.workOrder.client.account.password;
			if (sendMail) {
				$scope.workOrder.sendMail = true;
			}
			if (sendTotech) {
				if ($scope.crewHeaderAdded.length == 0) {
					toaster.error('The Work Order couldn\'t be saved, please check if some required field is empty');
					$scope.waiting = false;
					return
				}
				$scope.workOrder.sendTotech = true;
			} else {
				$scope.workOrder.sendTotech = false;
			}

			$scope.workOrder.save()
				.then(function (data) {
					toaster.success('The Work Order was saved successfully');
					$location.path('workOrderList')
					$scope.waiting = false;
				},
				function (error) {
					console.log(error);
					toaster.error('The Work Order couldn\'t be saved, please check if some required field is empty or if its duplicated');
					$scope.waiting = false;
				});
		};

		$scope.delete = function () {
			var dlg = dialogs.confirm('Warning', 'Are you sure you want to delete?');
			dlg.result.then(function (btn) {
				$scope.workOrder.remove()
					.then(function () {
						toaster.success('The work order was deleted successfully');
						$location.path('/workOrderList')
					});
			});
		};

		$scope.export = function (showPrice) {
			$scope.workOrder.download(showPrice);
		};

		$scope.send = function () {
			$scope.workOrder.send();
		};

		$scope.fillComment = function () {
			$scope.workOrder.comment = "Reference work order #" + $scope.workOrder.wor;
		}

		if (workOrder.client) {
			$scope.clientChanged(workOrder.client);
		}

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
			$scope.workOrder.crewHeader = $scope.crewHeaderAdded
		}
		$scope.crewHeaderRemove = function (index) {
			$scope.crewHeaderAdded.splice(index, 1);
			$scope.workOrder.crewHeader = $scope.crewHeaderAdded
		};
	});
