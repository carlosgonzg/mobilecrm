angular.module('MobileCRMApp')
.directive('crudTypeTable', function () {
	return {
		templateUrl : 'views/directives/crudTypeTable.html',
		restrict : 'E',

		scope : {
			clase : '=clase',
			fields : '=fields',
			show : '=showId',
			options : '@',
			filterParams : '='
		},

		controller : function ($scope, $rootScope, $http, dialogs, toaster) {

			$scope.totalDisplayed = 10;
			// Opciones
			$scope.options = $scope.options || {};
			// Lista de los elementos de la tabla
			$scope.list = [];
			// Elemento que esta siendo editado o que sera insertado
			$scope.currentElement = {};
			// Objeto de la clase que se utiliza para hacer las funciones basicas, como search, count, paginatedSearch, etc.
			$scope.objeto = new $scope.clase();
			// Cantidad de registros de la tabla
			$scope.qty = 0;
			// Pagina actual
			$scope.currentPage = 1;
			// Cantidad de paginas disponibles
			$scope.maxPage = 0;
			// Metodo para Ordenar
			$scope.orderBy = {
				sort : {
					'_id' : 1
				},
				reverse : false,
				field : '_id'
			};
			// clase doctor
			$scope.wsClass = null;
			// Arreglo que se utiliza para restaurar el arreglo original cuando se cancela una edicion.
			var listBk = [];
			var searchByFields = ['_id'];
			// Parametros que se le pasaran al paginatedSearch
			$scope.params = {
				filter : $scope.filterParams || {},
				limit : 10,
				skip : 0,
				sort : $scope.orderBy.sort,
				search : '',
				fields : searchByFields,
				all : ($scope.options.paginated) ? $scope.options.paginated.all || false : false
			};

			$scope.wsFields = [];

			// Funcion para crear un nuevo elemento.
			$scope.createElement = function () {
				delete $scope.objeto.edit;
				$scope.objeto.save().then(function (obj) {
					toaster.pop('success', 'Information', 'The item was added successfully');
					$scope.currentElement = {};
					$scope.list.push(angular.copy($scope.objeto));
					listBk = angular.copy($scope.list);
					$scope.objeto = new $scope.clase();
				}, function (error) {
					toaster.pop('error', 'Informacion', error.message);
					$scope.objeto.edit = true;
				});
			};

			// Funcion para actualizar un elemento
			$scope.updateElement = function () {
				if ($scope.currentElement.edit) {
					delete $scope.currentElement.edit;
					$scope.currentElement.update().then(function (data) {
						toaster.pop('success', 'Information', 'The item was updated successfully');
						listBk = angular.copy($scope.list);
					}, function (error) {
						toaster.pop('error', 'Information', error.message);
						$scope.list = angular.copy(listBk);
						throw new Error(error)
					});
				}
			};

			// Funcion para eliminar un elemento
			$scope.deleteElement = function (elem) {
				if (!$scope.currentElement.edit) {
					var confirm = dialogs.confirm('Delete Item', 'Are you sure you want to delete this item?');
					confirm.result.then(function (btn) {
						elem.delete ().then(function (data) {
							toaster.pop('success', 'Information', 'The item was deleted successfully');
							$scope.list = _.reject($scope.list, function (item) {
									return item._id == elem._id
								});
							listBk = angular.copy($scope.list)
						}, function (error) {
							toaster.pop('error', 'Information', error);
						});
					});
				}
			};

			// Funcion que habilita los campos para editar el elemento que se quiere actualizar.
			$scope.editElement = function (elem) {
				if ($scope.currentElement.edit && $scope.currentElement._id != elem._id && !angular.equals($scope.currentElement, $scope.currentElementBk)) {
					var confirm = dialogs.confirm('Save', 'Do you want to save the item?');
					confirm.result
					.then(function (btn) {
						console.log(btn)
						$scope.updateElement()
					})
					.catch (function (a) {
						$scope.cancelEdition($scope.currentElement)
					});
				} else if ($scope.currentElement._id != elem._id) {
					delete $scope.currentElement.edit;
					$rootScope.currentElement = elem;
					$scope.currentElement = elem;
					$scope.currentElement.edit = true;
					$scope.currentElementBk = angular.copy(elem);
				}

			};

			// Funcion que habilita los campos para editar el elemento que se quiere actualizar.
			$scope.cancelEdition = function (elem) {
				elem.edit = false;
				delete $rootScope.currentElement;
				$scope.currentElement = {};
				$scope.list = angular.copy(listBk);
				$scope.objeto = new $scope.clase();
			};

			// Agregar un elemento al arreglo para luego guardarlo
			$scope.addElement = function () {
				if (!$scope.currentElement.edit) {
					$scope.currentElement = $scope.objeto;
					$scope.currentElement.edit = true;
				}
			};

			// Funcion que crea o actualiza un tipo de cuenta
			$scope.save = function () {
				if ($scope.currentElement._id) {
					$scope.updateElement();
				} else {
					$scope.createElement();
				}
			};

			// Obtener los registros de la tabla paginados.
			$scope.getPaginatedSearch = function (params) {
				$scope.objeto.paginatedSearch(params).then(function (data) {
					$scope.list = angular.copy(data.data);
					listBk = angular.copy(data.data);
				}, function (error) {
					toaster.pop('error', 'Information', 'Couldn\'t load the items');
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

			$scope.selectedDoctor = function (doctor) {
				if (doctor) {
					if ($scope.params.filter) {
						$scope.params.filter = JSON.parse($scope.params.filter);
						$scope.params.filter.doctorId = doctor._id;
					} else {
						$scope.params.filter = {
							doctorId : doctor._id
						};
					}
				} else {
					$scope.params.filter = JSON.parse($scope.params.filter);
					delete $scope.params.filter.doctorId;
				}

				$scope.params.filter = JSON.stringify($scope.params.filter);

				$scope.search();
			}

			$scope.loadMore = function () {
				console.log('$scope.totalDisplayed', $scope.totalDisplayed);
				$scope.totalDisplayed += 5;
			};

			// $scope.selectedServicio = function (servicio) {
			//   $scope.params.filter = JSON.parse($scope.params.filter);
			//   $scope.params.filter['Servicio'] = servicio;
			//   $scope.params.filter = JSON.stringify($scope.params.filters);
			//   $scope.search();
			// }

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

			// Toma un objeto y una ruta. Devuelve el valor encontrado en esa ruta.
			$scope.inception = function (obj, path) {
				return path.split('.').reduce(function (prev, actual) {
					return prev[actual];
				}, obj);
			};

			//
			$scope.getFieldLabel = function (value, options) {
				var option = _.findWhere(options, {
						value : value
					});
				return (option) ? option.label : 'No disponible';
			};

			// Funcion que carga un modal con el view y el controller pasados por un field dado
			$scope.openModal = function (config, elem) {
				$scope.currentElement = {};
				delete elem.edit;
				config.data.object = elem;
				var index = _.findIndex($scope.list, {
						_id : elem._id
					});
				var dialog = dialogs.create(config.view, config.controller, config.data);

				dialog.result.then(
					function (result) {
					if (config.create) {
						var objeto = new $scope.clase(result);
						objeto.save().then(function (data) {
							$scope.getPaginatedSearch($scope.params);
						})
					} else {
						elem = result;
						$scope.list[index] = result;
						listBk = angular.copy($scope.list);
					}

				},
					function (result) {
					// No seleccionaste nada
				});

			};

			$scope.filterCollection = function (filtro, name, config, current) {
				// if($scope.arreglos[name].length) return;
				var sort = {};
				sort[config.label] = 1;

				config.clase.paginatedSearch({
					filter : config.where(current), // Es el where de Mongo
					limit : 20, // Limite de elementos a traer
					skip : 0, // Lleva el control de lo que se debe de mostrar en la lista.
					sort : sort, // Ordenar
					search : filtro, // Expresion Regular
					tabla : config.collection, // Nombre de la tabla
					fields : [config.value, config.label], // Nombres de campos a evaluar en el RegExpr
					noAuth : false
				})
				.then(function (data) {
					$scope.arreglos[name] = data.data.map(function (item) {
							return {
								value : item[config.value],
								label : item[config.label]
							};
						});

					$scope.arreglos[name] = _.uniq($scope.arreglos[name], 'value')
						// console.log($scope.arreglos[name])

						// for (var i in listBk) {
						//   for (var f in $scope.fields) {
						//     var field = $scope.fields[f];
						//     if (field.type === 'collection' || field.type === 'collection-multiple') {
						//       $scope.list[i][field.name] = listBk[i][field.name];
						//     }
						//   }
						//   // for (var i in $scope.list) {

						//   // }
						// }
						// console.log($scope.list)

				});
			};
			// Main

			// Aqui se preparan las opciones para los Fields
			$scope.arreglos = {};
			$scope.arreglosBK = {};
			angular.forEach($scope.fields, function (field, key) {
				// console.log(field.config)
				if (field.type === 'select') {
					if (field.config) {
						field.options = field.options.map(function (option) {
								return {
									value : ((field.config.value === 'Object') ? option : $scope.inception(option, field.config.value)),
									label : $scope.inception(option, field.config.label)
								};
							});
					} else {
						field.options = field.options.map(function (option) {
								return {
									value : option,
									label : option
								};
							});
					}
				} else if (field.type === 'collection' || field.type === 'collection-multiple') {
					if (!field.config)
						throw Error('Por favor configure los campos para realizar la búsqueda', 'field.config is undefined');
					$scope.arreglos[field.name] = [];
				}
				// console.log(field.options);
			});

			// Buscar los tipos de cuentas
			$scope.getPaginatedSearch($scope.params);

			// Contar la cantidad de tipos de cuentas que hay en la base de datos
			$scope.objeto.count($scope.filterParams || {}).then(function (res) {
				$scope.maxPage = res < $scope.params.limit ? 1 : Math.ceil(res / $scope.params.limit);
			});

			// Extraer los campos pasados por parametros (fields)
			for (var x in $scope.fields) {
				if ($scope.fields[x].type === 'select' && $scope.fields[x].routeInDb) {
					searchByFields.push($scope.fields[x].routeInDb);
				} else {
					searchByFields.push($scope.fields[x].name);
				}
			}

			$scope.initIconSelector = function () {
				$('.iconpicker').iconpicker();
			}
		}
	};
});
