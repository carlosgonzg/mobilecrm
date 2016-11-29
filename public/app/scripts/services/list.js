'use strict';

angular.module('MobileCRMApp')
.factory('List', function ($http, $q) {

	// Variable que se utiliza para comprobar si un objeto tiene una propiedad
	// var hasProp = Object.prototype.hasOwnProperty;

	// Nombre de la clase
	var List;

	function List() {
		this.baseApiPath = "/api/list";
	}

	List.prototype.get = function(id){
		var d = $q.defer();
		$http.get(this.baseApiPath + '/' + id)
		.success(function (res) {
			d.resolve(res);
		})
		.error(function () {
			return d.resolve([]);
		});
		return d.promise;
	};

	return new List();
});
