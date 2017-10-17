'use strict';

var q = require('q');
var util = require('./util');
var Crud = require('./crud');

function List(db) {
	//Listados
	this.phoneType = [{
		_id: 1,
		description: 'Home'
	},{
		_id: 2,
		description: 'Mobile'
	},{
		_id: 3,
		description: 'Work'
	},{
		_id: 4,
		description: 'Other'
	}
	];
	this.status = [
		{
			_id: 1,
			description: 'Pending'
		},{
			_id: 2,
			description: 'In Progress'
		},{
			_id: 3,
			description: 'Completed'
		},{
			_id: 4,
			description: 'Paid'
		},{
			_id: 5,
			description: 'Cancelled'
		},{
			_id: 6,
			description: 'Scheduled'
		},{
			_id: 7,
			description: 'Completed Under Warranty'
		},{
			_id: 8,
			description: 'Service Miles Only'
		}
	];
	this.search = [
		{
			code: 'MobileOne',
			description: 'MobileOne'
		},{
			code: 'User',
			description: 'Customer'
		},{
			code: 'Company',
			description: 'Company'
		},{
			code: 'Branch',
			description: 'Branch'
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