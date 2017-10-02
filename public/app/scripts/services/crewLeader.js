'use strict';

angular.module('MobileCRMApp')
	.factory('techLabor', function (Base, $location) {

		// Variable que se utiliza para comprobar si un objeto tiene una propiedad
		// var hasProp = Object.prototype.hasOwnProperty;

		// Nombre de la clase
		var user;

		function user(propValues) {
			user.super.constructor.apply(this, arguments);
			this.baseApiPath = "/api/crewLeader";
			this.price = this.price || 0;
			this.quantity = this.quantity || 1;
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
		extend(user, Base);

		// Funcion que retorna las propiedades de una cuenta
		user.properties = function () {
			var at = {};
			return at;
		};

		user.prototype.getTotalPrice = function () {
			return this.price * (this.quantity || 1);
		};

		user.prototype.goTo = function () {
			$location.path('/crewLeader/' + this._id);
		};

		return user;

	});
