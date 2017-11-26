'use strict';

angular.module('MobileCRMApp')
.factory('User', function (Base, $http, $q, $window, $rootScope, $location, dialogs, toaster, RoleOptions) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var User;

	function User(propValues) {
		User.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/user";
		this.account = this.account || {};
		this.addresses = this.addresses || [];
		this.phones = this.phones || [];
		this.role = this.role || null;
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

	User.prototype.getRoleOptions = function(){
		var d = $q.defer();
		var roleOptions = new RoleOptions();
		var query = {
			roleId: this.role._id,
			'userExceptions.user._id' : {$ne: $rootScope.userData._id} 
		}
		if ($rootScope.userData.company) {
			query['companyExceptions.company._id'] = {$ne: $rootScope.userData.company._id}
		}


		roleOptions.filter(query)
		.then(function(result){
			result.data.sort(function(a, b){
				return a.sort - b.sort;
			});
			d.resolve(result.data);
		});
		return d.promise;
	};
	User.prototype.getAccessOfView = function (path, dontRedirect) {
		var d = $q.defer();
		var roleOptions = new RoleOptions();
		if(!path){
			path = $location.path();
			path = '/' + path.split('/')[1];
		}
		var result = {
			read: false,
			write: false,
			delete: false,
			update: false
		};
		if(['/login', '/noaccess', '/', '/changepassword'].indexOf(path) == -1){
			var isHere = false;
			$rootScope.roleOptions.forEach(function(rOption){
				if(rOption.option.url == path){
					result.read = rOption.read;
					result.write = rOption.write;
					result.delete = rOption.delete;
					result.update = rOption.update;
					isHere = true;
				}
				if (rOption.submenu) {
					for (var i=0; i<rOption.options.length;i++) {
						if(rOption.options[i].option.url == path){
							result.read = rOption.options[i].read;
							result.write = rOption.options[i].write;
							result.delete = rOption.options[i].delete;
							result.update = rOption.options[i].update;
							isHere = true;
						}
					}
				}
			});
			if(!isHere && !dontRedirect){
				$location.path('/noaccess');
			}
		}
		else {
			result = {
				read: true,
				write: true,
				delete: true,
				update: true
			};
		}
		return result;
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
			_this.getRoleOptions()
			.then(function(rOptions){
				$window.sessionStorage.roleOptions = JSON.stringify(rOptions);
				$rootScope.roleOptions = rOptions;
				d.resolve(_this);
			});
			
		})
		.error(function (error) {
			d.reject(error);
		});
		return d.promise;
	};

	User.prototype.getSequence = function (table) {
		var d= $q.defer();
		var _this = this;
		var params = {
			table: table
		}
		console.log(params)
		$http.post(this.baseApiPath + '/getActualSequence', params)
		.success(function (result) {
			console.log(result)
			d.resolve(Number(result));
		})
		.error(function (error) {
			console.log(error)
		})
		return d.promise;
	}

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
	User.prototype.forgetPassword = function(){
		var _this = this;
		var dialog = dialogs.create('views/forgetPassword.html', 'ForgetPasswordCtrl');
		dialog.result.then(function (res) {
			$http.post('/user/forgetPassword', {
				email: res
			})
			.success(function(result){
				toaster.success('The email was sent successfully');
			})
			.error(function (error) {
				console.log(error);
				toaster.error(error.errors);
			});
		}, function (res) {});
	};

	User.prototype.changePassword = function(){
		var _this = this;
		var dialog = dialogs.create('views/changePassword.html', 'ChangePasswordCtrl');
		dialog.result.then(function (res) {
			$http.post('/user/changePassword', {
				username: res.email,
				password: res.password
			})
			.success(function(result){
				toaster.success('The password was changed successfully');
			})
			.error(function (error) {
				console.log(error);
				toaster.error(error.errors);
			});
		}, function (res) {});
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
		$location.path('/user/' + this._id);
	};
	User.prototype.miniUser = function(){
		var user = angular.copy(this);
		delete user.account.password;
		return user;
	};
	return User;
});
