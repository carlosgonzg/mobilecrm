'use strict';

var q = require('q');
var Crud = require('./crud');
var Address = require('./address');
var Item = require('./item');
var _ = require('underscore');
var util = require('./util');

function OrderService(db, userLogged) {
	this.crud = new Crud(db, 'ORDERSERVICE', userLogged);
	//DB Table Schema
	this.schema = {
		id : '/OrderService',
		type : 'object',
		properties : {
			client : {
				type : 'object',
				required : true
			},
			invoiceNumber : {
				type : 'string',
				required : true
			},
			sor : {
				type : 'string',
				required : true
			},
			pono : {
				type : 'string',
				required : true
			},
			unitno : {
				type : 'string',
				required : true
			},
			isono : {
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
	this.crud.uniqueFields = ['account.email'];
	this.role = new Role(db);
	this.option = new Option(db);
	this.roleOptions = new RoleOptions(db);
}

OrderService.prototype.insert = function (orderService) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < orderService.items.length; i++) {
		total += orderService.items[i].quantity * orderService.items[i].price;
	}
	orderService.total = total;
	//Consigo el sequencial de invoice
	util.getYearlySequence(_this.crud.db, 'OrderService')
	.then(function (sequence) {
		orderService.invoiceNumber = sequence;
		return _this.crud.insert(orderService);
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

OrderService.prototype.update = function (id, orderService) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < orderService.items.length; i++) {
		total += orderService.items[i].quantity * orderService.items[i].price;
	}
	orderService.total = total;
	var query = {
		_id : id
	};
	_this.crud.update(query, orderService)
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

module.exports = OrderService;
