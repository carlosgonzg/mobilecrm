'use strict';

angular.module('MobileCRMApp')
.factory('Company', function (Base, $http, $q, $window, $rootScope, $location, toaster) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Company;

	function Company(propValues) {
		Company.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/company";
		this.entity = this.entity || { name: '' };
		this.addresses = this.addresses || [];
		this.phones = this.phones || [];
		this.seqCode = this.seqCode || '';
		this.seqMask = this.seqMask || 0;
		this.seqStart = this.seqStart || 0;
		this.seqCodeDor = this.seqCodeDor || '';
		this.seqMaskDor = this.seqMaskDor || 0;
		this.seqStartDor = this.seqStartDor || 0;

		if(!this.seqNumber){
			this.seqNumber = angular.copy(this.seqStart);
		}
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
	extend(Company, Base);

	// Funcion que retorna las propiedades de una cuenta
	Company.properties = function () {
		var at = {};
		return at;
	};
	Company.prototype.goTo = function () {
		$location.path('/company/' + this._id);
	};

	Company.prototype.peek = function(dor){
		var d = $q.defer();
		$http.get(this.baseApiPath + '/sequence/peek/' + this._id + '&' + dor)
		.success(function (data) {
			d.resolve(data);
	    })
	    .error(function (data, status, headers, config) {
	        d.reject(data);
	    });
		return d.promise;
	};

	Company.prototype.quotes = function (dor) {
		var d = $q.defer();
		$http.get(this.baseApiPath + '/sequence/estimate/' + this._id)
			.success(function (data) {
				d.resolve(data);
			})
			.error(function (data, status, headers, config) {
				d.reject(data);
			});
		return d.promise;
	};
	return Company;

});
