'use strict';

var q = require('q');
var Crud = require('./crud');
var Address = require('./address');
var Item = require('./item');
var _ = require('underscore');
var util = require('./util');
var Excel = require('./excel');
var moment = require('moment');
var User = require('./user');
var pdf = require('../pdf');
var fs = require('fs')

function OrderService(db, userLogged, dirname) {
	this.crud = new Crud(db, 'ORDERSERVICE', userLogged);
	this.user = new User(db, '', userLogged);
	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id : '/OrderService',
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
	//this.crud.uniqueFields = ['invoiceNumber'];
}

OrderService.prototype.insert = function (orderService, username, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < orderService.items.length; i++) {
		total += orderService.items[i].quantity * orderService.items[i].price;
	}
	orderService.total = total;
	//Consigo el sequencial de invoice
	var promise = orderService.invoiceNumber ? q.when(orderService.invoiceNumber) : util.getYearlySequence(_this.crud.db, 'OrderService');
	promise
	.then(function (sequence) {
		orderService.invoiceNumber = sequence;
		return _this.crud.insert(orderService);
	})
	//inserto
	.then(function (obj) {
		_this.sendOrderService(obj.data._id, username, mail);
		d.resolve(obj);
	})
	.catch (function (err) {
		console.log(err)
		d.reject({
			result : 'Not ok',
			errors : err
		});
	});
	return d.promise;
};

OrderService.prototype.update = function (query, orderService, username, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < orderService.items.length; i++) {
		total += orderService.items[i].quantity * orderService.items[i].price;
	}
	orderService.total = total;
	_this.crud.update(query, orderService)
	.then(function (obj) {
		_this.sendOrderServiceUpdate(query._id, username, mail);
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

OrderService.prototype.sendOrderService = function(id, username, mail){
	var d = q.defer();
	var _this = this;
	var orderService = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	var emails = [];
	_this.crud.find({ _id: id })
	.then(function(orderS){
		orderService = orderS.data[0];
		return _this.user.getAdminUsers();
	})
	.then(function(users){
		emails = [ ];
		for(var i = 0; i < users.data.length; i++){
			emails.push(users.data[i].account.email);
		}
		return _this.createOrderService(id, username);
	})
	.then(function(excel){
		fileName = orderService.invoiceNumber + '.xlsx';
		fileNamePdf = orderService.invoiceNumber + '.pdf';
		url = _this.dirname + '/api/orderservices/' + fileName; 
		urlPdf = _this.dirname + '/api/orderservices/' + fileNamePdf; 
		//return excel.workbook.xlsx.writeFile(url);
		return pdf.createOrderService(orderService);
	})
	.then(function(){
		return mail.sendOrderService(orderService, emails, urlPdf, fileNamePdf);
	})
	.then(function(){
		d.resolve(true);
	})
	.catch (function (err) {
		console.log(err)
		d.reject({
			result : 'Not ok',
			errors : err
		});
	});
	return d.promise;
};

OrderService.prototype.sendOrderServiceUpdate = function(id, username, mail){
	var d = q.defer();
	var _this = this;
	var orderService = {};
	var emails = [];
	_this.crud.find({ _id: id })
	.then(function(orderS){
		orderService = orderS.data[0];
		return _this.user.getAdminUsers();
	})
	.then(function(users){
		emails = [ ];
		for(var i = 0; i < users.data.length; i++){
			emails.push(users.data[i].account.email);
		}
		return _this.createOrderService(id, username);
	})
	.then(function(){
		return mail.sendOrderServiceUpdate(orderService, emails, username);
	})
	.then(function(){
		d.resolve(true);
	})
	.catch (function (err) {
		console.log(err)
		d.reject({
			result : 'Not ok',
			errors : err
		});
	});
	return d.promise;
};

OrderService.prototype.createOrderService = function(id, username){
	var d = q.defer();
	var _this = this;
	var query = {
		_id: id
	};
	_this.crud.find(query)
	.then(function (result) {
		return pdf.createOrderService(result.data[0]);
	})
	.then(function (data) {
		d.resolve(data);
	})
	.catch (function (err) {
		d.reject({
			result : 'Not ok',
			errors : err
		});
	});
	return d.promise;
};

OrderService.prototype.getOrderService = function(id, res, username){
	this.createOrderService(id, username)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType("application/pdf");
			res.send(data);
		});
	});
};


module.exports = OrderService;
