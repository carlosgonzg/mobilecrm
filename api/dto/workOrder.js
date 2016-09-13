'use strict';

var q = require('q');
var Crud = require('./crud');
var Address = require('./address');
var Item = require('./item');
var _ = require('underscore');
var util = require('./util');

function WorkOrder(db, userLogged) {
	this.crud = new Crud(db, 'WORKORDER', userLogged);
	//DB Table Schema
	this.schema = {
		id : '/WorkOrder',
		type : 'object',
		properties : {
			client : {
				type : 'object',
				required : true
			},
			date : {
				type : 'date',
				required : true
			},
			invoiceNumber : {
				type : 'string',
				required : true
			},
			siteAddress : new Address().schema,
			phone : {
				type : 'object',
				required : true
			},
			items : {
				type : 'array',
				required : true,
				items : new Item().schema
			},
			comment : {
				type : 'string',
				required : false
			},
			status : {
				type : 'object',
				required : true
			},
			total : {
				type : 'int',
				required : true
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = ['invoiceNumber'];
}

WorkOrder.prototype.insert = function (workOrder) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < workOrder.items.length; i++) {
		total += workOrder.items[i].quantity * workOrder.items[i].price;
	}
	workOrder.total = total;
	//Consigo el sequencial de invoice
	util.getYearlySequence(_this.crud.db, 'WorkOrder')
	.then(function (sequence) {
		workOrder.invoiceNumber = sequence;
		return _this.crud.insert(workOrder);
	})
	//inserto
	.then(function (obj) {
		d.resolve(obj);
	})
	.catch (function (err) {
		d.reject({
			result : 'Not ok',
			errors : err
		});
	});
	return d.promise;
};

WorkOrder.prototype.update = function (query, workOrder) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < workOrder.items.length; i++) {
		total += workOrder.items[i].quantity * workOrder.items[i].price;
	}
	workOrder.total = total;
	_this.crud.update(query, workOrder)
	.then(function (obj) {
		d.resolve(obj);
	})
	.catch (function (err) {
		d.reject({
			result : 'Not ok',
			errors : err
		});
	});
	return d.promise;
};

module.exports = WorkOrder;
