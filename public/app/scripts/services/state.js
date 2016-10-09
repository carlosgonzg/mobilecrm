'use strict';

angular.module('MobileCRMApp')
.factory('State', function (Base, $http, $q, City) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var State;

	function State(propValues) {
		State.super.constructor.apply(this, arguments);
		this.baseApiPath = "/api/state";
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
	extend(State, Base);

	// Funcion que retorna las propiedades de una cuenta
	State.properties = function () {
		var at = {};
		return at;
	};

	State.prototype.getMyCities = function(){
		var d = $q.defer();
		new City().find({ stateId: this._id })
		.then(function(data){
			d.resolve(data);
		}, function(err){
			d.reject(err);
		});
		return d.promise;
	};

	return State;

});
