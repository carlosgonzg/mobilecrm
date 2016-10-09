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
		'angularValidator',
		'ui.select'
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
	.when('/orderServiceList', {
		templateUrl : 'views/orderServiceList.html',
		controller : 'OrderServiceListCtrl'
	})
	.when('/orderService/:id?', {
		templateUrl : 'views/orderService.html',
		controller : 'OrderServiceCtrl',
		resolve:{
			items : function (Item) {
				return new Item().find({});
			},
			orderService : function (OrderService, $route) {
				if ($route.current.params.id) {
					return new OrderService().findById(parseInt($route.current.params.id));
				} else {
					return new OrderService();
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
			workOrder : function (WorkOrder, $route) {
				if ($route.current.params.id) {
					return new WorkOrder().findById(parseInt($route.current.params.id));
				} else {
					return new WorkOrder();
				}
			}
		}
	})
	.when('/report', {
		templateUrl : 'views/report.html',
		controller : 'ReportCtrl',
		resolve:{
			clients : function (User) {
				return new User().filter({ 'role._id': { $ne: 1} });
			},
			countries : function (Country) {
				return new Country().find();
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
