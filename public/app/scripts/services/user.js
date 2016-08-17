﻿'use strict';

angular.module('MobileCRMApp')
.factory('User', function (Base, $http, $q, $window, $rootScope, $location, toaster) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var User;

	function User(propValues) {
		User.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/user";
		this.account = this.account || {};
		this.addresses = this.addresses || [];
		this.roleId = this.roleId || null;
	}
	var extend = function (child, parent) {
		var key;
		for (key in parent) {
			if (hasProp.call(parent, key)) {
				child[key] = parent[key];
			}
		}

		function Ctor() {
			this.constructor = child;
		}
		Ctor.prototype = parent.prototype;
		child.prototype = new Ctor();
		child.super = parent.prototype;
		return child;
	};
	// Extender de la clase Base
	extend(User, Base);

	// Funcion que retorna las propiedades de una cuenta
	User.properties = function () {
		var at = {};
		return at;
	};

	User.prototype.getActualUser = function () {
		var d = $q.defer();
		var _this = this;
		$http.get(_this.baseApiPath + '/actual')
		.success(function (result) {
			_this.assignProperties(result.data);
			$rootScope.userData = _this;
			$rootScope.isAuthenticated = true;
			$window.sessionStorage.isAuthenticated = true;
			$window.sessionStorage.user = JSON.stringify($rootScope.userData);
			d.resolve(_this);
		})
		.error(function (error) {
			d.reject(error);
		});
		return d.promise;
	};
	User.prototype.register = function () {
		var d = $q.defer();
		var _this = this;
		$http.post('/user/register', _this)
		.success(function (result) {
			_this.assignProperties(result.data);
			d.resolve(_this);
		})
		.error(function (error) {
			d.reject(error);
		});
		return d.promise;
	};
	User.prototype.login = function () {
		var d = $q.defer();
		var _this = this;
		var query = {
			email : this.account.email,
			password : this.account.password
		};
		$http.post('/user/login', query)
		.success(function (result) {
			$window.sessionStorage.token = result.token;
			_this.getActualUser()
			.then(function (result) {
				d.resolve(result)
			},
				function (error) {
				toaster.error(error.errors);
				d.reject(error);
			});
		})
		.error(function (error) {
			console.log(error);
			toaster.error(error.errors);
			d.reject(error);
		});
		return d.promise;
	};

	User.prototype.logout = function () {
		delete $rootScope.userData;
		delete $rootScope.isAuthenticated;
		delete $window.sessionStorage.token;
		delete $window.sessionStorage.user;
		delete $window.sessionStorage.isAuthenticated;
		$location.path('/login');
	};
	User.prototype.goTo = function () {
		$location.path('user/' + this.id);
	};

	return User;

});