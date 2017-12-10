'use strict';

var app = angular
	.module('MobileCRMApp', [
		'ngAnimate',
		'ngAria',
		'ngCookies',
		'ngMessages',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ngTouch',
		'toaster',
		'ui.bootstrap',
		'dialogs.main',
		'validation',
		'validation.rule',
		'ui.select',
		'ngFileUpload',
		'hmTouchEvents'
	])
	.config(function ($routeProvider) {
		$routeProvider
			.when('/login', {
				templateUrl: 'views/login.html',
				controller: 'LoginCtrl',
				resolve: {
					changePassword: function () {
						return false;
					}
				}
			})
			.when('/userList', {
				templateUrl: 'views/userList.html',
				controller: 'UserListCtrl',
				resolve: {
					roles: function (Role) {
						return new Role().find({});
					}
				}
			})
			.when('/roleList', {
				templateUrl: 'views/roleList.html',
				controller: 'RoleListCtrl'
			})
			.when('/optionList', {
				templateUrl: 'views/optionList.html',
				controller: 'OptionListCtrl'
			})
			.when('/roleOptionsList', {
				templateUrl: 'views/roleOptionsList.html',
				controller: 'RoleOptionListCtrl',
				resolve: {
					roles: function (Role) {
						return new Role().find({});
					},
					companies: function (Company) {
						return new Company().find({});
					},
					users: function (User) {
						return new User().find({});
					},
					options: function (Option) {
						return new Option().find({});
					}
				}
			})
			.when('/user/:id?', {
				templateUrl: 'views/user.html',
				controller: 'UserCtrl',
				resolve: {
					countries: function (Country) {
						return new Country().find({});
					},
					roles: function (Role) {
						return new Role().find({});
					},
					companies: function (Company) {
						return new Company().find({});
					},
					user: function (User, $route) {
						if ($route.current.params.id) {
							return new User().findById(parseInt($route.current.params.id));
						} else {
							return new User();
						}
					}
				}
			})
			.when('/changepassword/:token', {
				templateUrl: 'views/login.html',
				controller: 'LoginCtrl',
				resolve: {
					changePassword: function () {
						return true;
					}
				}
			})
			.when('/item/:id?', {
				templateUrl: 'views/item.html',
				controller: 'ItemCtrl',
				resolve: {
					item: function (Item, $route) {
						if ($route.current.params.id) {
							return new Item().findById(parseInt($route.current.params.id));
						} else {
							return new Item();
						}
					},
					companies: function (Company) {
						return new Company().filter({});
					}
				}
			})
			.when('/itemList', {
				templateUrl: 'views/itemList.html',
				controller: 'ItemListCtrl'
			})
			.when('/itemCollection/:id?', {
				templateUrl: 'views/itemCollection.html',
				controller: 'ItemCollectionCtrl',
				resolve: {
					itemCollection: function (ItemCollection, $route) {
						if ($route.current.params.id) {
							return new ItemCollection().findById(parseInt($route.current.params.id));
						} else {
							return new ItemCollection();
						}
					},
					items: function (Item) {
						return new Item().find();
					}
				}
			})
			.when('/itemCollectionList', {
				templateUrl: 'views/itemCollectionList.html',
				controller: 'ItemCollectionListCtrl'
			})
			.when('/serviceOrderList', {
				templateUrl: 'views/serviceOrderList.html',
				controller: 'ServiceOrderListCtrl'
			})
			.when('/serviceOrder/:id?', {
				templateUrl: 'views/serviceOrder.html',
				controller: 'ServiceOrderCtrl',
				resolve: {
					statusList: function (List) {
						return List.get('status');
					},
					serviceOrder: function (ServiceOrder, $route) {
						if ($route.current.params.id) {
							return new ServiceOrder().findById(parseInt($route.current.params.id));
						} else {
							return new ServiceOrder();
						}
					},
					CrewCollection: function (CrewCollection, $route) {
						return new CrewCollection().filter({ "role.description": 'Crew Leader' })
					},
					ItemDefault: function (Item) {
						return new Item().filter({ _id: { $in: [253] } })
					}
				}
			})
			.when('/invoiceList', {
				templateUrl: 'views/invoiceList.html',
				controller: 'InvoiceListCtrl'
			})
			.when('/invoice/:id?', {
				templateUrl: 'views/invoice.html',
				controller: 'InvoiceCtrl',
				resolve: {
					statusList: function (List) {
						return List.get('status');
					},
					statusDelivery: function (List) {
						return List.get('statusDelivery');
					},
					companies: function (Company) {
						return new Company().filter({});
					},
					invoice: function (Invoice, $route) {
						if ($route.current.params.id) {
							return new Invoice().findById(parseInt($route.current.params.id));
						} else {
							return new Invoice();
						}
					},
					Driver: function (User) {
						return new User().filter({ 'role._id': 6 })
					},
				}
			})
			.when('/workOrderList', {
				templateUrl: 'views/workOrderList.html',
				controller: 'WorkOrderListCtrl'
			})
			.when('/workOrder/:id?', {
				templateUrl: 'views/workOrder.html',
				controller: 'WorkOrderCtrl',
				resolve: {
					statusList: function (List) {
						return List.get('status');
					},
					workOrder: function (WorkOrder, $route) {
						if ($route.current.params.id) {
							return new WorkOrder().findById(parseInt($route.current.params.id));
						} else {
							return new WorkOrder();
						}
					},
					CrewCollection: function (CrewCollection, $route) {
						return new CrewCollection().filter({ "role.description": 'Crew Leader' })
					},
					ItemDefault: function (Item) {
						return new Item().filter({ _id: { $in: [5] } })
					}
				}
			})
			.when('/reportSO', {
				templateUrl: 'views/reportSO.html',
				controller: 'ReportSOCtrl',
				resolve: {
					clients: function (User) {
						return new User().filter({ 'role._id': { $ne: 1 } });
					},
					countries: function (Country) {
						return new Country().find();
					},
					statusList: function (List) {
						return List.get('status');
					},
					companyList: function (Company) {
						return new Company().filter({});
					}
				}
			})
			.when('/reportWO', {
				templateUrl: 'views/reportWO.html',
				controller: 'ReportWOCtrl',
				resolve: {
					clients: function (User) {
						return new User().filter({ 'role._id': { $ne: 1 } });
					},
					countries: function (Country) {
						return new Country().find();
					},
					statusList: function (List) {
						return List.get('status');
					},
					items: function (Item) {
						return new Item().filter({});
					},
					companyList: function (Company) {
						return new Company().filter({});
					}
				}
			})
			.when('/reportInvoice', {
				templateUrl: 'views/reportInvoice.html',
				controller: 'ReportInvoiceCtrl',
				resolve: {
					clients: function (User) {
						return new User().filter({ 'role._id': { $ne: 1 } });
					},
					countries: function (Country) {
						return new Country().find();
					},
					statusList: function (List) {
						return List.get('status');
					},
					items: function (Item) {
						return new Item().filter({});
					},
					companyList: function (Company) {
						return new Company().filter({});
					}
				}
			})
			.when('/reportExpenses', {
				templateUrl: 'views/reportExpenses.html',
				controller: 'ReportExpensesCtrl',
				resolve: {
					clients: function (User) {
						return new User().filter({ 'role._id': { $ne: 1 } });
					},
					countries: function (Country) {
						return new Country().find();
					},
					statusList: function (List) {
						return List.get('status');
					},
					items: function (Item) {
						return new Item().filter({});
					},
					companyList: function (Company) {
						return new Company().filter({});
					}
				}
			})
			.when('/companyList', {
				templateUrl: 'views/companyList.html',
				controller: 'CompanyListCtrl'
			})
			.when('/company/:id?', {
				templateUrl: 'views/company.html',
				controller: 'CompanyCtrl',
				resolve: {
					company: function (Company, $route) {
						if ($route.current.params.id) {
							return new Company().findById(parseInt($route.current.params.id));
						} else {
							return new Company();
						}
					}
				}
			})
			.when('/branchList', {
				templateUrl: 'views/branchList.html',
				controller: 'BranchListCtrl'
			})
			.when('/branch/:id?', {
				templateUrl: 'views/branch.html',
				controller: 'BranchCtrl',
				resolve: {
					branch: function (Branch, $route) {
						if ($route.current.params.id) {
							return new Branch().findById(parseInt($route.current.params.id));
						} else {
							return new Branch();
						}
					},
					companies: function (Company) {
						return new Company().find();
					}
				}
			})
			.when('/monthlyStatement', {
				templateUrl: 'views/monthlyStatement.html',
				controller: 'MonthlyStatementCtrl',
				resolve: {
					searchList: function (List) {
						return List.get('search');
					},
					userList: function (User, $rootScope) {
						var query = { 'role._id': { $ne: 1 } };
						if ($rootScope.userData.isRegionalManager) {
							query._id = $rootScope.userData._id;
						}
						return new User().filter();
					},
					companyList: function (Company) {
						return new Company().filter({});
					},
					branchList: function (Branch, $rootScope) {
						var query = {};
						if ($rootScope.userData.isRegionalManager) {
							query['company._id'] = $rootScope.userData.company._id;
						}
						return new Branch().filter(query);
					},
					statusList: function (List) {
						return List.get('status');
					}
				}
			})
			.when('/profit', {
				templateUrl: 'views/profit.html',
				controller: 'ProfitCtrl',
				resolve: {
					invoices: function (Invoice) {
						return new Invoice().getExpenses();
					},
					companies: function (Company) {
						return new Company().find({});
					}
				}
			})
			.when('/crewLeaderList', {
				templateUrl: 'views/crewLeaderList.html',
				controller: 'crewLeaderListCtrl',
				resolve: {
					roles: function (Role) {
						return new Role().find({});
					}
				}
			})
			.when('/crewLeader/:id?', {
				templateUrl: 'views/crewLeader.html',
				controller: 'crewLeaderCtrl',
				resolve: {
					countries: function (Country) {
						return new Country().find({});
					},
					roles: function (Role) {
						return new Role().find({});
					},
					companies: function (Company) {
						return new Company().find({});
					},
					user: function (User, $route) {
						if ($route.current.params.id) {
							return new User().findById(parseInt($route.current.params.id));
						} else {
							return new User();
						}
					},
					item: function (Item, $route) {
						var query = { typeItem: 'Labor' };

						return new Item().filter(query);
					}
				}
			})
			.when('/techniciansList', {
				templateUrl: 'views/techniciansList.html',
				controller: 'technicianListCtrl'
			})
			.when('/techniciansSO/:id?', {
				templateUrl: 'views/techniciansSO.html',
				controller: 'techniciansSOCtrl',
				resolve: {
					statusList: function (List) {
						return List.get('status');
					},
					serviceOrder: function (ServiceOrder, $route) {
						if ($route.current.params.id) {
							return new ServiceOrder().findById(parseInt($route.current.params.id));
						} else {
							return new ServiceOrder();
						}
					},
					ItemDefault: function (Item) {
						return new Item().filter({ _id: { $in: [253] } })
					},
					CrewCollection: function (CrewCollection, $route) {
						return new CrewCollection().filter({ "role.description": 'Crew Leader' })
					},
				}
			})
			.when('/techniciansWO/:id?', {
				templateUrl: 'views/techniciansWO.html',
				controller: 'techniciansWOCtrl',
				resolve: {
					statusList: function (List) {
						return List.get('status');
					},
					workOrder: function (WorkOrder, $route) {
						if ($route.current.params.id) {
							return new WorkOrder().findById(parseInt($route.current.params.id));
						} else {
							return new WorkOrder();
						}
					},
					CrewCollection: function (CrewCollection, $route) {
						return new CrewCollection().filter({ "role.description": 'Crew Leader' })
					},
					ItemDefault: function (Item) {
						return new Item().filter({ _id: { $in: [253] } })
					},
				}
			})
			.when('/paymentRunList', {
				templateUrl: 'views/paymentRunList.html',
				controller: 'paymentListCtrl'
			})
			.when('/paymentRun/:id?', {
				templateUrl: 'views/paymentRun.html',
				controller: 'paymentRunCtrl',
				resolve: {
					ServiceOrder: function (ServiceOrder, $route) {
						if ($route.current.params.id) {
							return new ServiceOrder().findById(parseInt($route.current.params.id));
						}
					}
				}
			})
			.when('/paymentRunWO/:id?', {
				templateUrl: 'views/paymentRunWo.html',
				controller: 'paymentRunWoCtrl',
				resolve: {
					WorkOrder: function (WorkOrder, $route) {
						if ($route.current.params.id) {
							return new WorkOrder().findById(parseInt($route.current.params.id));
						}
					}
				}
			})
			.when('/DeliveryOrderList', {
				templateUrl: 'views/deliveryOrderList.html',
				controller: 'DeliveryOrderListCtrl'
			})
			.when('/DeliveryOrder/:id?', {
				templateUrl: 'views/deliveryOrder.html',
				controller: 'DeliveryOrderCtrl',
				resolve: {
					statusList: function (List) {
						return List.get('statusDelivery'); 
					},
					EntranceList: function (List) {
						return List.get('Entrance');
					},
					DeliveryOrder: function (DeliveryOrder, $route) {
						if ($route.current.params.id) {
							return new DeliveryOrder().findById(parseInt($route.current.params.id));
						} else {
							return new DeliveryOrder();
						}
					},
					ItemDefault: function (Item) {
						return new Item().filter({ _id: { $in: [805, 806] } })
					},
					Driver: function (User) {
						return new User().filter({ 'role._id': 6 })
					},
				}
			})
			.when('/noaccess', {
				templateUrl: 'views/noaccess.html'
			})
			.otherwise({
				redirectTo: '/'
			});
	});

app.run(function ($rootScope) {
	//This code will be executed on AngularJS initilization
	Highcharts.setOptions({
		lang: {
			decimalPoint: '.',
			thousandsSep: ','
		}
	});
});
