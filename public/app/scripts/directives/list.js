angular.module('MobileCRMApp')
	.directive('list', function () {
		return {
			templateUrl: 'views/directives/lists.html',
			restrict: 'E',
			scope: {
				clase: '=clase',
				fields: '=fields',
				excelTitle: '=excelTitle',
				excelFields: '=excelFields',
				showId: '=showId',
				searchFields: '=searchFields',
				filterDate: '=filterDate',
				dblClickFn: '=dblClick',
				filterField: '=',
				searchBar: '=',
				noAuth: '=',
				advanced: '=',
				sortList: '=',
				sortField: '=?',
				showDeleteAction: '='
			},
			controller: function ($scope, $rootScope, $timeout, dialogs, toaster, Loading, $window, Company, Branch, $location) {
				$scope.list = [];
				$scope.userData = $rootScope.userData;
				$scope.companies = [];
				$scope.branches = [{ _id: -1, name: "All Branches" }];
				$scope.currentElement = {};
				$scope.objeto = new $scope.clase();
				$scope.qty = 0;
				$scope.currentPage = 1;
				$scope.maxPage = 0;
				$scope.sortField = $scope.sortField ? $scope.sortField : { 'createdDate': -1 }
				$scope.orderBy = {
					// sort : {
					// 	'createdDate' : -1
					// },
					sort: $scope.sortField,
					reverse: false,
					field: '_id'
				};
				$scope.invoiceTypeList = [
					{ _id: 'sor', description: 'Service Order' },
					{ _id: 'wor', description: 'Work Order' },
					{ _id: 'dor', description: 'Delivery Order' },
					{ _id: 'smo', description: 'Service Miles Only' },
					{ _id: 'All', description: 'All Types' }
				];

				$scope.statusList = [
					{ _id: -1, description: 'All' },
					{ _id: 1, description: 'Pending' },
					{ _id: 6, description: 'Scheduled' },
					{ _id: 2, description: 'In Progress' },
					{ _id: 3, description: 'Completed' },
					{ _id: 9, description: 'Completed - Pending Invoice' },
					{ _id: 4, description: 'Paid' },
					{ _id: 5, description: 'Cancelled' },
					{ _id: 7, description: 'Completed Under Warranty' },
					{ _id: 8, description: 'Service Miles Only' },
					{ _id: 10, description: 'Hold for Customer' }
				];

				if ($scope.objeto.baseApiPath == "/api/deliveryOrder") {
					$scope.statusList = [
						{ _id: -1, description: 'All' },
						{ _id: 1, description: 'Waiting for Availability' },
						{ _id: 9, description: 'Scheduled' },
						{ _id: 2, description: 'Confirm' },
						{ _id: 3, description: 'On Route' },
						{ _id: 4, description: 'Delivered' },
						{ _id: 11, description: 'Delivered - Pending Invoice' },
						{ _id: 10, description: 'Hold for Customer' },
						{ _id: 5, description: 'Cancelled' },
						{ _id: 6, description: 'Pending to Pay' },
						{ _id: 7, description: 'Paid' },
						{ _id: 8, description: 'Dry Run' }
					];
				}

				var today = new Date();
				$scope.filterDateOptions = {
					fromDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
					toDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
					enabled: true
				};

				var listBk = [],
					searchByFields = ['_id'],
					x,
					message = '',
					filtro = $scope.filterField ? $scope.filterField : {}
				//filtroOrBackup = $scope.filterField && $scope.filterField.$and ? $scope.filterField.$and : [];
				var params = {};

				var actualPath = $location.path();
				if ($window.sessionStorage.params && actualPath === $window.sessionStorage.path) {
					$scope.params = JSON.parse($window.sessionStorage.params);
					var functionFields = _.where($scope.fields, { type: 'function' })
					delete $window.sessionStorage.params;
				}
				else {
					$scope.params = {
						filter: filtro,
						limit: 10,
						skip: 0,
						sort: $scope.orderBy.sort,
						search: '',
						searchView: '',
						fields: $scope.searchFields,
						noAuth: $scope.noAuth,
						advanced: $scope.advanced,
						title: $scope.excelTitle,
						excelFields: $scope.excelFields || $scope.fields,
						fieldFilter: {},
						company: {},
						branch: {},
						status: {}
					};

					var functionFields = _.where($scope.fields, { type: 'function' })

					if ($scope.sortList == "-1") {
						$scope.params.sort = {
							_id: -1
						};
					} else if ($scope.sortList == "1") {
						$scope.params.sort = {
							_id: 1
						};
					};

					if ($scope.objeto.baseApiPath === '/api/invoice')
						$scope.params['invoiceType'] = { _id: 'All', description: 'All Types' };


					if ($scope.filterDate && $scope.filterDateOptions.enabled) {
						var dateRange = {};
						dateRange.start = $scope.filterDateOptions.fromDate;
						dateRange.end = $scope.filterDateOptions.toDate;
						dateRange.fields = [];
						dateRange.fields.push($scope.filterDate);

						$scope.params.dateRange = dateRange;
					}
				}

				$scope.loaded = false;
				searchByFields = $scope.searchFields;
				angular.forEach($scope.fields, function (field, key) {
					field.sortable = (field.sortable == undefined) ? true : field.sortable;
					if (field.type === 'select') {
						if (field.config) {
							field.options = field.options.map(function (option) {
								return {
									value: ((field.config.value === 'Object') ? option : option[field.config.value]),
									label: option[field.config.label]
								};
							});
						} else {
							field.options = field.options.map(function (option) {
								return {
									value: option,
									label: option
								};
							});
						}
					} else if (field.type === 'function') {
						field.type = 'currency'
					}
				});

				var setFieldLimit = function () {
					// Acortar el nombre que se muestra
					var table = document.getElementById('columnRender');
					var cells = table.rows[0].cells;
					for (var i in cells) {
						if (cells[i].clientWidth) {
							if ($scope.objeto.baseApiPath == "/api/deliveryOrder") {
								if ($scope.fields[i].name == "pono") {
									$scope.fields[i].limit = 50
								} else {
									$scope.fields[i].limit = 13 
								}
							} else {
								$scope.fields[i].limit = Math.ceil((cells[i].clientWidth) / 4);
							}
						}
					};
				};

				var parseValue = function (value) {
					var result = value;
					if (typeof value == 'object' && !(value instanceof Date)) {
						result = [];
						for (var i in value) {
							result.push(value[i]);
						}
						result = result.join(',');
					}
					return result;
				};

				// Toma un objeto y una ruta. Devuelve el valor encontrado en esa ruta.
				$scope.inception = function (obj, path) {
					var result = path.split('.').reduce(function (prev, actual) {
						return prev[actual] || '';
					}, obj);
					return parseValue(result) || '';
				};

				$scope.getFieldLabel = function (value, options, routeInDb) {
					var i;
					for (i in options) {
						if (options[i].value == value)
							return options[i].label;
					}
					return 'No disponible';
				};

				var getFieldValues = function (value, options) {
					var i,
						result = [],
						found = false,
						regex = new RegExp(value, 'i');

					if (value.length) {
						for (i in options) {
							if (regex.test(options[i].label)) {
								result.push(options[i].value);
							}
						}
					}
					return result;
				};

				$scope.resolve = function (path, obj, aFunction, def) {

					var def = def || '';

					if (path && obj) {
						var a = [obj || self].concat(path.split('.')).reduce(function (prev, curr) {
							return prev[curr];
						});

						if (aFunction) {
							a = a[aFunction]();
							return a;
						} else if (!aFunction) { }
						return a;
					} else if (typeof aFunction == 'function') {
						return aFunction(obj);
					} else if (aFunction) {
						return obj[aFunction]();
					} else {
						return def;
					}

				}

				//Obtener los registros de la tabla paginados.
				$scope.getPaginatedSearch = function (pParams) {
					Loading.show();
					delete pParams.dateRange;
					if ($scope.filterDate && $scope.filterDateOptions.enabled) {
						pParams.dateRange = {};
						pParams.dateRange.start = $scope.filterDateOptions.fromDate;
						pParams.dateRange.end = $scope.filterDateOptions.toDate;
						pParams.dateRange.fields = [];
						pParams.dateRange.fields.push($scope.filterDate);
					}

					$scope.objeto.paginatedSearch(pParams).then(function (result) {
						if (result.data.length == 0) {
							//	toaster.pop('error', 'Information', 'Couldn\'t load the items');
						}
						$scope.list = angular.copy(result.data);
						//- Aqui se preparan las opciones para los Fields que son select
						functionFields.forEach(function (field) {
							$scope.list.forEach(function (obj) {
								obj.temp = obj.temp || {};
								obj.temp[field.name] = field.function(obj);
								obj[field.name] = obj.temp[field.name];
							});
						});

						listBk = angular.copy(result.data);
						$scope.loaded = true;
						// Define el limite para los campos a mostrar
						if (result.data.length) {
							$timeout(function () {
								setFieldLimit();
							});
						}
						Loading.hide();
					}, function (error) {
						//toaster.pop('error', 'Information', 'Couldn\'t load the items');
						if (error == 'error') {
							$scope.list = [];
							listBk = [];
							$scope.loaded = true;
							Loading.hide();
						}
						console.log(error, 'error');
					});
				};

				//Download Excel
				$scope.downloadExcel = function (pParams) {
					var _params = angular.copy(pParams);

					//Leave out all the function fields
					if (!_params.title) {
						_params.title = $scope.excelTitle;
					}
					_params.excelFields = _.filter(_params.excelFields, function (field) {
						return (field.function == undefined)
					})
					console.warn(_params.excelFields);
					$scope.objeto.excel(_params)
						.then(function (result) {
							toaster.pop('success', 'Information', 'File downloaded');
						}, function (error) {
							//toaster.pop('error', 'Information', 'Couldn\'t load the items');
						});
				};

				// Ir a la pagina anterior
				$scope.prevPage = function () {
					if ($scope.currentPage > 1) {
						$scope.currentPage--;
						$scope.params.skip = (($scope.currentPage - 1) * $scope.params.limit);
						$scope.getPaginatedSearch($scope.params);
					}
				};
				// Ir a la pagina siguiente
				$scope.nextPage = function () {
					if ($scope.currentPage < $scope.maxPage) {
						$scope.currentPage++;
						$scope.params.skip += $scope.list.length;
						$scope.getPaginatedSearch($scope.params);
					}
				};

				// Ir al final de la pagina
				$scope.finPage = function () {
					if ($scope.currentPage < $scope.maxPage) {
						$scope.currentPage = $scope.maxPage;
						$scope.params.skip = ($scope.maxPage * $scope.list.length) - $scope.list.length;
						$scope.getPaginatedSearch($scope.params);
					}
				};
				// Ir al principio de la pagina
				$scope.firstPage = function () {
					if ($scope.currentPage <= $scope.maxPage) {
						$scope.currentPage = 1;
						$scope.params.skip = 10;
						$scope.getPaginatedSearch($scope.params);
					}
				};

				// Activar o desactivar el boton de ir atras
				$scope.prevPageDisabled = function () {
					return $scope.currentPage === 1 ? "disabled" : "";
				};
				// Activar o desactivar el boton de ir adelante
				$scope.nextPageDisabled = function () {
					return $scope.currentPage === $scope.maxPage ? "disabled" : "";
				};
				// Funcion para buscar un elemento especifico
				$scope.search = function () {
					$scope.objeto.paginatedCount($scope.params).then(function (res) {
						res = res.count;
						$scope.currentPage = 1;
						$scope.maxPage = res < $scope.params.limit ? 1 : Math.ceil(res / $scope.params.limit);
					});
					$scope.params.skip = 0;
					$scope.getPaginatedSearch($scope.params);
				};

				// Funcion para filtrar de forma ascendente o descendente por los campos mostrados en pantalla.
				$scope.filter = function (field) {
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
					$scope.getPaginatedSearch($scope.params);
				};

				$scope.delete = function (elem, fieldName) {
					var dlg = dialogs.confirm('Warning',
						'Are you sure you want to remove item: [' + elem[fieldName] + '] ?');
					dlg.result.then(function (btn) {
						elem.remove()
							.then(function () {
								toaster.success('The item was removed successfully');
								$scope.getPaginatedSearch($scope.params);
							})
							.catch(function (error) {
								toaster.error(error.message);
							});
					});
				};

				$scope.matching = function (value) {
					return (value === parseInt(value));
				};

				$scope.dblClick = function (elem, event) {
					if (event.type == 'click') {
						$window.sessionStorage.params = JSON.stringify($scope.params);
						$window.sessionStorage.path = $location.path();
						if ($scope.dblClickFn) {
							$scope.dblClickFn(elem);
						} else {
							elem.goTo(elem._id);
						}
					}
				};

				$scope.setOrderClass = function (field) {

					if ($scope.orderBy.field === field.name) {
						if ($scope.orderBy.reverse) {
							return {
								'fa fa-caret-down': true
							};
						} else {
							return {
								'fa fa-caret-up': true
							};
						}
					} else {
						return {
							'': true
						};
					}
				};

				$scope.getCompanies = function () {
					new Company().find().then(function (result) {
						$scope.companies.push({ _id: -1, entity: { name: "All Companies" }, order: 0 })

						for (let index = 0; index < result.data.length; index++) {
							$scope.companies.push({ _id: result.data[index]._id, entity: { name: result.data[index].entity.name }, order: result.data[index].order })
						}
					})
				}

				$scope.getBranches = function (company) {
					$scope.branches = [];
					var query = { 'company._id': company._id };
					new Branch().filter(query).then(function (result) {
						$scope.branches = result.data;
						$scope.branches.push({ _id: -1, name: "All Branches" })
					})
				}
				$scope.getStatus = function (company) {
					$scope.branches = [];
					var query = { 'company._id': company._id };
					new Branch().filter(query).then(function (result) {
						$scope.branches = result.data;
						$scope.branches.push({ _id: -1, name: "All Branches" })
					})
				}

				$scope.filterByCompany = function () {
					console.log($scope.params)

					if ($scope.params.company._id != -1) {
						$scope.params.filter["client.company._id"] = $scope.params.company._id;
					} else {
						delete $scope.params.filter["client.company._id"]
					}
					$scope.search();
					$scope.getBranches($scope.params.company)
				}

				$scope.filterByBranch = function () {
					console.log($scope.params.invoiceType)

					if ($scope.params.branch._id != -1) {
						$scope.params.filter["client.branch._id"] = $scope.params.branch._id;
					} else {
						delete $scope.params.filter["client.branch._id"]
					}
					$scope.search();
				}

				$scope.filterByOrigin = function () {
					delete $scope.params.filter.sor;
					delete $scope.params.filter.wor;
					delete $scope.params.filter.dor;


					if ($scope.params.invoiceType._id === 'sor')
						$scope.params.filter["sor"] = { $exists: true };
					else if ($scope.params.invoiceType._id === 'wor')
						$scope.params.filter["wor"] = { $exists: true };
					else if ($scope.params.invoiceType._id === 'dor')
						$scope.params.filter["dor"] = { $exists: true };
					else if ($scope.params.invoiceType._id === 'smo')
						$scope.params.filter["status._id"] = 8;


					$scope.search();
				}

				$scope.filterByStatus = function () {
					$scope.params.filter["status._id"] = $scope.params.status._id
					$scope.search();
				}

				//Ejecutar busqueda cuando se cambie algun parametro en filter
				$scope.$watch(function () {
					return JSON.stringify($scope.filterField);

				}, function (data) {
					$scope.getPaginatedSearch($scope.params);
				})

				// Buscar los tipos de cuentas
				$scope.objeto.paginatedCount($scope.params).then(function (res) {
					$scope.maxPage = res.count < $scope.params.limit ? 1 : Math.ceil(res.count / $scope.params.limit);
					var page = ($scope.params.skip + $scope.params.limit) / $scope.params.limit;
					$scope.currentPage = page < 1 ? 1 : page;
					$scope.getPaginatedSearch($scope.params);
				});

				// Extraer los campos pasados por parametros (fields)
				for (x in $scope.fields) {
					if ($scope.fields[x].routeInDb) {
						var levels = $scope.fields[x].routeInDb.split('.');
						var b,
							c = $scope.fields[x].routeInDb;

						for (var i in levels.length) {
							c = b[levels[i]];
						}
					}
				}

				$scope.getCompanies();
				$scope.params.company = { _id: -1, description: "All Companies", order: 0 };
				$scope.params.branch = { _id: -1, description: "All Branches" };
				$scope.params.status = { _id: -1, description: "All" };
			}
		};
	});
