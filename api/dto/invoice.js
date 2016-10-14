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

function Invoice(db, userLogged, dirname) {
	this.crud = new Crud(db, 'INVOICE', userLogged);
	this.user = new User(db, '', userLogged);
	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id : '/Invoice',
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
				required : false
			},
			unitno : {
				type : 'string',
				required : false
			},
			isono : {
				type : 'string',
				required : false
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

Invoice.prototype.insert = function (orderService, username, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < orderService.items.length; i++) {
		total += orderService.items[i].quantity * orderService.items[i].price;
	}
	orderService.total = total;
	//Consigo el sequencial de invoice
	util.getYearlySequence(_this.crud.db, 'Invoice')
	.then(function (sequence) {
		orderService.invoiceNumber = sequence;
		return _this.crud.insert(orderService);
	})
	//inserto
	.then(function (obj) {
		_this.sendInvoice(obj.data._id, username, mail);
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

Invoice.prototype.update = function (query, orderService, username, mail) {
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
		_this.sendInvoiceUpdate(query._id, username, mail);
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

Invoice.prototype.sendInvoice = function(id, username, mail){
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
		emails = [ orderService.client.account.email ];
		for(var i = 0; i < users.data.length; i++){
			emails.push(users.data[i].account.email);
		}
		return _this.createInvoice(id, username);
	})
	.then(function(excel){
		fileName = orderService.invoiceNumber + '.xlsx';
		fileNamePdf = orderService.invoiceNumber + '.pdf';
		url = _this.dirname + '/api/invoices/' + fileName; 
		urlPdf = _this.dirname + '/api/invoices/' + fileNamePdf; 
		//return excel.workbook.xlsx.writeFile(url);
		return pdf.createInvoice(orderService);
	})
	.then(function(){
		return mail.sendInvoice(orderService.invoiceNumber, emails, urlPdf, fileNamePdf);
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

Invoice.prototype.sendInvoiceUpdate = function(id, username, mail){
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
		return _this.createInvoice(id, username);
	})
	.then(function(){
		console.log('alo')
		return mail.sendInvoiceUpdate(orderService.invoiceNumber, emails, username);
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

Invoice.prototype.createInvoice = function(id, username){
	var d = q.defer();
	var _this = this;
	var query = {
		_id: id
	};
	_this.crud.find(query)
	.then(function (result) {
		return pdf.createInvoice(result.data[0]);
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

Invoice.prototype.getInvoice = function(id, res, username){
	this.createInvoice(id, username)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType("application/pdf");
			res.send(data);
		});
	});
};


module.exports = Invoice;
