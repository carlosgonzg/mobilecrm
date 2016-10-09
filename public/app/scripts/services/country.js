'use strict';

angular.module('MobileCRMApp')
.factory('Country', function (Base, $http, $q, State) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var Country;

	function Country(propValues) {
		Country.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/country";
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
	extend(Country, Base);

	// Funcion que retorna las propiedades de una cuenta
	Country.properties = function () {
		var at = {};
		return at;
	};

	Country.prototype.getMyStates = function(){
		var d = $q.defer();
		new State().find({ countryId: this._id })
		.then(function(data){
			d.resolve(data);
		}, function(err){
			d.reject(err);
		});
		return d.promise;
	};

	return Country;

});
