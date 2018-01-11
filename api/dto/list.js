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
		}, {
			_id: 6,
			description: 'Scheduled'
		}, {
			_id: 2,
			description: 'In Progress'
		},{
			_id: 3,
			description: 'Completed'
		}, {
			_id: 9,
			description: 'Completed - Pending Invoice'
		}, {
			_id: 4,
			description: 'Paid'
		},{
			_id: 5,
			description: 'Cancelled'
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
	this.statusDelivery = [
		{
			_id: 1,
			description: 'Waiting for Availability'
		}, {
			_id: 9,
			description: 'Scheduled'
		}, {
			_id: 2,
			description: 'Confirm'
		}, {
			_id: 3,
			description: 'On Route'
		}, {
			_id: 4,
			description: 'Delivered'
		}, {
			_id: 11,
			description: 'Delivered - Pending Invoice'
		}, {
			_id: 10,
			description: 'Hold for Customer'
		}, {
			_id: 5,
			description: 'Cancelled'
		}, {
			_id: 6,
			description: 'Pending to Pay'
		}, {
			_id: 7,
			description: 'Paid'
		},{
			_id: 8,
			description: 'Dry Run'
		}
	];
	this.Entrance = [
		{
			_id: 1,
			description: 'Big truck'
		}, {
			_id: 2,
			description: 'Small truck'
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