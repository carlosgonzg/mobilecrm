'use strict';

angular
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
		'ngFileUpload'
	])
.config(function ($routeProvider) {
	$routeProvider
	.when('/login', {
		templateUrl : 'views/login.html',
		controller : 'LoginCtrl',
		resolve: {
			changePassword: function(){
				return false;
			}
		}
	})
	.when('/userList', {
		templateUrl : 'views/userList.html',
		controller : 'UserListCtrl'
	})
	.when('/roleList', {
		templateUrl : 'views/roleList.html',
		controller : 'RoleListCtrl'
	})
	.when('/optionList', {
		templateUrl : 'views/optionList.html',
		controller : 'OptionListCtrl'
	})
	.when('/roleOptionsList', {
		templateUrl : 'views/roleOptionsList.html',
		controller : 'RoleOptionListCtrl',
		resolve: {
			roles : function (Role) {
				return new Role().find({});
			},
			options : function (Option) {
				return new Option().find({});
			}
		}
	})
	.when('/user/:id?', {
		templateUrl : 'views/user.html',
		controller : 'UserCtrl',
		resolve : {
			countries : function (Country) {
				return new Country().find({});
			},
			roles : function (Role) {
				return new Role().find({});
			},
			companies : function (Company) {
				return new Company().find({});
			},
			user : function (User, $route) {
				if ($route.current.params.id) {
					return new User().findById(parseInt($route.current.params.id));
				} else {
					return new User();
				}
			}
		}
	})
	.when('/changepassword/:token', {
		templateUrl : 'views/login.html',
		controller : 'LoginCtrl',
		resolve: {
			changePassword: function(){
				return true;
			}
		}
	})
	.when('/itemList', {
		templateUrl : 'views/itemList.html',
		controller : 'ItemListCtrl',
		resolve:{
			items : function (Item) {
				return new Item().find({});
			},
			clients : function (User) {
				return new User().filter({ 'role._id': { $ne: 1} });
			}
		}
	})
	.when('/serviceOrderList', {
		templateUrl : 'views/serviceOrderList.html',
		controller : 'ServiceOrderListCtrl'
	})
	.when('/serviceOrder/:id?', {
		templateUrl : 'views/serviceOrder.html',
		controller : 'ServiceOrderCtrl',
		resolve:{
			items : function (Item) {
				return new Item().find({});
			},
			statusList: function(List){
				return List.get('status');
			},
			serviceOrder : function (ServiceOrder, $route) {
				if ($route.current.params.id) {
					return new ServiceOrder().findById(parseInt($route.current.params.id));
				} else {
					return new ServiceOrder();
				}
			}
		}
	})
	.when('/invoiceList', {
		templateUrl : 'views/invoiceList.html',
		controller : 'InvoiceListCtrl'
	})
	.when('/invoice/:id?', {
		templateUrl : 'views/invoice.html',
		controller : 'InvoiceCtrl',
		resolve:{
			items : function (Item) {
				return new Item().find({});
			},
			statusList: function(List){
				return List.get('status');
			},
			invoice : function (Invoice, $route) {
				if ($route.current.params.id) {
					return new Invoice().findById(parseInt($route.current.params.id));
				} else {
					return new Invoice();
				}
			}
		}
	})
	.when('/workOrderList', {
		templateUrl : 'views/workOrderList.html',
		controller : 'WorkOrderListCtrl'
	})
	.when('/workOrder/:id?', {
		templateUrl : 'views/workOrder.html',
		controller : 'WorkOrderCtrl',
		resolve:{
			items : function (Item) {
				return new Item().find({});
			},
			statusList: function(List){
				return List.get('status');
			},
			workOrder : function (WorkOrder, $route) {
				if ($route.current.params.id) {
					return new WorkOrder().findById(parseInt($route.current.params.id));
				} else {
					return new WorkOrder();
				}
			}
		}
	})
	.when('/reportSO', {
		templateUrl : 'views/reportSO.html',
		controller : 'ReportSOCtrl',
		resolve:{
			clients : function (User) {
				return new User().filter({ 'role._id': { $ne: 1} });
			},
			countries : function (Country) {
				return new Country().find();
			},
			statusList: function(List){
				return List.get('status');
			}
		}
	})
	.when('/reportWO', {
		templateUrl : 'views/reportWO.html',
		controller : 'ReportWOCtrl',
		resolve:{
			clients : function (User) {
				return new User().filter({ 'role._id': { $ne: 1} });
			},
			countries : function (Country) {
				return new Country().find();
			},
			statusList: function(List){
				return List.get('status');
			},
			items: function(Item){
				return new Item().filter({});
			}
		}
	})
	.when('/companyList', {
		templateUrl : 'views/companyList.html',
		controller : 'CompanyListCtrl'
	})
	.when('/company/:id?', {
		templateUrl : 'views/company.html',
		controller : 'CompanyCtrl',
		resolve : {
			company : function (Company, $route) {
				if ($route.current.params.id) {
					return new Company().findById(parseInt($route.current.params.id));
				} else {
					return new Company();
				}
			}
		}
	})
	.when('/branchList', {
		templateUrl : 'views/branchList.html',
		controller : 'BranchListCtrl'
	})
	.when('/branch/:id?', {
		templateUrl : 'views/branch.html',
		controller : 'BranchCtrl',
		resolve : {
			branch : function (Branch, $route) {
				if ($route.current.params.id) {
					return new Branch().findById(parseInt($route.current.params.id));
				} else {
					return new Branch();
				}
			},
			companies : function (Company) {
				return new Company().find();
			}
		}
	})
	.when('/noaccess', {
		templateUrl : 'views/noaccess.html'
	})
	.otherwise({
		redirectTo : '/'
	});
});
