'use strict';

angular.module('MobileCRMApp')
.directive('entitypicker', function () {
	return {
		restrict : 'E',
		scope : {
			ngModel : '=',
			wsClass : '=',
			wsFields : '=', //There's a little change here in comparison to List or crudtypetable
			wsLabel : '=?',
			filterByOwner : '=?',
			goTo : '&?',
			ngChange : '&?',
			disable : '=ngDisabled',
			wsList : '=',
			wsDefault : '='
		},
		templateUrl : 'views/directives/entitypicker.html',
		controller : function ($scope, $timeout, dialogs, toaster) {
			$scope.wsLabel = $scope.wsLabel || 'entity.fullName';
			$scope.showModal = function () {
				var dialog = dialogs.create('views/directives/entitypicker.modal.html', 'EntityPickerCtrl', {
						wsClass : $scope.wsClass,
						wsFields : $scope.wsFields,
						filterByOwner : $scope.filterByOwner,
						list : $scope.wsList,
					default:
						$scope.wsDefault
					});
				dialog.result.then(function (res) {
					$scope.ngModel = res;
					$timeout(function () {
						if ($scope.ngChange) {
							$scope.ngChange();
						}
					});
				}, function (res) {});
			};
			$scope.clean = function () {
				$scope.ngModel = undefined;
				$scope.selectedName = '';
				$timeout(function () {
					if ($scope.ngChange) {
						$scope.ngChange();
					}
				});
			};
			$scope.$watch('ngModel', function (value) {

				var labels = $scope.wsLabel.split('.');
				var name = angular.copy(value);
				for (var i in labels) {
					if (name) {
						name = name[labels[i]];
					}
				}

				if (value && value.baseApiPath && value.baseApiPath == '/api/centroMedico')
					$scope.selectedName = value.entity.name || '';
				else if (value && value.baseApiPath && value.baseApiPath == '/api/paciente')
					$scope.selectedName = value.fullName || '';
				else
					$scope.selectedName = name || '';
			}, true);
		}
	};
})
.controller('EntityPickerCtrl', function ($scope, $rootScope, $uibModalInstance, $q, toaster, data) {
	$scope.defaultObj = angular.copy(data.default);
			$scope.isCollapsed = true;
			$scope.entitySelected = {};
			$scope.currentPage = 1;
			$scope.maxPage = 0;
			var wsClassHandler = new data.wsClass();
			$scope.orderBy = {
				sort : {},
				reverse : false,
				field : '_id'
			};
			var searchFields = ['_id'];
			$scope.filtro = {};
			if (data.filterByOwner) {
				$scope.filtro[data.filterByOwner] = ownerId;
			}
			$scope.wsFields = data.wsFields;
			//Setting searchFields
			var setSearchFields = function () {
				searchFields = ['_id'];
				for (var i = 0; i < $scope.wsFields.length; i++) {
					searchFields.push($scope.wsFields[i].field);
				}
			};
			//Check if there are "OPTIONS" filters, if its so then find distinct values from the database of that field
			var setSearchFilter = function () {
				var promises = [];
				$scope.wsFields.forEach(function (field, index) {
					if (field.type.toUpperCase() == 'OPTIONS') {
						wsClassHandler.distinct(field.field)
						.then(function (data) {
							field.data = data;
							field.data.unshift('Seleccionar Todos');
							if (field.field == 'branchId' && $scope.defaultObj && JSON.stringify($scope.defaultObj) != '{}') {
								$scope.filtro[field.field] = angular.copy($scope.defaultObj._id);
							} else {
								$scope.filtro[field.field] != 'Seleccionar Todos'
							}
						});
					}
				});
			};

			setSearchFields();
			$scope.params = {
				filter : angular.copy($scope.filtro),
				limit : 10,
				skip : 0,
				sort : $scope.orderBy.sort,
				search : '',
				fields : searchFields,
				startDate : '',
				endDate : '',
				all : true
			};
			setSearchFilter();

			$scope.getData = function (entity, field) {
				var data = angular.copy(entity);

				if (typeof field == 'function') {
					data = field(data);
				} else {
					var properties = field.toString().split('.');
					for (var i = 0; i < properties.length; i++) {
						data = data[properties[i]];
					}
				}
				return data;
			};

			//Pagination


			var getPaginatedSearch = function (pParams) {
				if (pParams.filter && JSON.stringify(pParams.filter) != '{}' && pParams.filter.branchId && pParams.filter.branchId.$regex) {
					pParams.filter.branchId = pParams.filter.branchId.$regex;
				}
				wsClassHandler.paginatedSearch(pParams).then(function (data) {
					$scope.list = angular.copy(data.data);
					for (var i in $scope.list) {
						var ent = $scope.list[i];
					}
				}, function (error) {
					toaster.pop('error', '', 'No se pudo cargar los registros!', 5000);
				});
				wsClassHandler.paginatedCount(pParams).then(function (res) {
					res = res.count;
					$scope.maxPage = res < pParams.limit ? 1 : Math.ceil(res / pParams.limit);
				}, function (error) {
					console.log(error);
				});
			};
			$scope.selectPerson = function (ent) {
				$scope.entitySelected = ent;
				$scope.done();
			};
			$scope.done = function () {
				$uibModalInstance.close($scope.entitySelected);
			};
			$scope.close = function () {
				$uibModalInstance.dismiss();
			};
			$scope.search = function () {
				getPaginatedSearch($scope.params);
			};
			$scope.prevPage = function () {
				if ($scope.currentPage > 1) {
					$scope.currentPage--;
					$scope.params.skip = (($scope.currentPage - 1) * $scope.params.limit);
					getPaginatedSearch($scope.params);
				}
			};
			$scope.nextPage = function () {
				if ($scope.currentPage < $scope.maxPage) {
					$scope.currentPage++;
					$scope.params.skip += $scope.list.length;
					getPaginatedSearch($scope.params);
				}
			};
			$scope.changeOrder = function (field) {
				$scope.orderBy.sort = {};
				if ($scope.orderBy.field === field) {
					$scope.orderBy.reverse = !$scope.orderBy.reverse;
					$scope.orderBy.sort[field] = $scope.orderBy.reverse ? -1 : 1;
				} else {
					$scope.orderBy.field = field;
					$scope.orderBy.sort[field] = 1;
					$scope.orderBy.reverse = false;
				}
				$scope.params.sort = $scope.orderBy.sort;
			};
			$scope.filter = function (field, isDown, isSelect) {
				for (var i in $scope.filtro) {
					if ($scope.filtro[i] != '' && $scope.filtro[i] != 'Seleccionar Todos') {
						var fltr = angular.copy($scope.filtro[i]);
						$scope.params.filter[i] = {
							$regex : fltr,
							$options : 'i'
						};
					} else {
						delete $scope.params.filter[i];
					}
				}
				if (isDown == false && ($scope.filtro.branchId || $scope.defaultObj && JSON.stringify($scope.defaultObj) != '{}')) {
					$scope.params.filter['branchId'] = ($scope.filtro.branchId) ? $scope.filtro.branchId : angular.copy($scope.defaultObj._id);
				} else {
					delete $scope.params.filter.branchId;
				}
				getPaginatedSearch($scope.params);
			};
			$scope.setOrderClass = function (field) {
				if ($scope.orderBy.field === field) {
					if ($scope.orderBy.reverse) {
						return {
							'fa-sort-asc' : true,
							'fa-sort-desc' : false
						};
					} else {
						return {
							'fa-sort-asc' : false,
							'fa-sort-desc' : true
						};
					}
				} else {
					return {
						'fa-sort-asc' : false,
						'fa-sort-desc' : false
					};
				}
			};
			getPaginatedSearch($scope.params);
});
