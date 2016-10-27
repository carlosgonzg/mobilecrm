'use strict';

angular.module('MobileCRMApp')
.factory('Branch', function (Base, $http, $q, $window, $rootScope, $location, toaster) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Branch;

	function Branch(propValues) {
		Branch.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/branch";
		this.name = this.name || '';
		this.addresses = this.addresses || [];
		this.phones = this.phones || [];
		this.operationsManager = this.operationsManager || '';
		this.officeCoordinator = this.officeCoordinator || '';
		this.branchManager = this.branchManager || '';
		this.officeManager = this.officeManager || '';
		this.dispatcher = this.dispatcher || '';
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
	extend(Branch, Base);

	// Funcion que retorna las propiedades de una cuenta
	Branch.properties = function () {
		var at = {};
		return at;
	};
	Branch.prototype.goTo = function () {
		$location.path('/branch/' + this._id);
	};
	return Branch;

});
