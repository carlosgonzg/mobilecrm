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
		'angularValidator'
	])
.config(function ($routeProvider) {
	$routeProvider
	.when('/login', {
		templateUrl : 'views/login.html',
		controller : 'LoginCtrl'
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
	.when('/itemList', {
		templateUrl : 'views/itemList.html',
		controller : 'ItemListCtrl'
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
	.otherwise({
		redirectTo : '/'
	});
});
