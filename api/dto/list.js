'use strict';

var q = require('q');
var util = require('./util');
var Crud = require('./crud');

function List(db) {
	//Listados
	this.phoneType = [{
		_id: 1,
		type: 'Home'
	},{
		_id: 2,
		type: 'Mobile'
	},{
		_id: 3,
		type: 'Work'
	},{
		_id: 4,
		type: 'Other'
	}
	];
	this.serviceStatus = [
		{
			_id: 1,
			description: 'Pending'
		},
		{
			_id: 2,
			description: 'Paid'
		}
	];
};

List.prototype.getList = function(list){
	var d = q.defer();
	d.resolve(this[list] || []);
	return d.promise;
};
//Export
module.exports = List;