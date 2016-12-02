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
	this.crudCompany = new Crud(db, 'COMPANY', userLogged);
	this.crudBranch = new Crud(db, 'BRANCH', userLogged);
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
	//this.crud.uniqueFields = ['invoiceNumber'];
}

Invoice.prototype.insert = function (invoice, username, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < invoice.items.length; i++) {
		total += invoice.items[i].quantity * invoice.items[i].price;
	}
	invoice.total = total;
	//Consigo el sequencial de invoice
	var promise = invoice.invoiceNumber ? q.when(invoice.invoiceNumber) : util.getYearlySequence(_this.crud.db, 'Invoice');
	promise
	.then(function (sequence) {
		invoice.invoiceNumber = sequence;
		return _this.crud.insert(invoice);
	})
	//inserto
	.then(function (obj) {
		//_this.sendInvoice(obj.data._id, username, mail);
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

Invoice.prototype.update = function (query, invoice, username, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < invoice.items.length; i++) {
		total += invoice.items[i].quantity * invoice.items[i].price;
	}
	invoice.total = total;
	_this.crud.update(query, invoice)
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

Invoice.prototype.sendInvoice = function(id, username, mail, emails){
	var d = q.defer();
	var _this = this;
	var invoice = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	var cc = [];
	var company = {};
	var branch = {};
	_this.crud.find({ _id: id })
	.then(function(invoiceS){
		invoice = invoiceS.data[0];		
		return _this.crudCompany.find({ _id: invoice.client.company._id });
	})
	//busco compañia
	.then(function(companyS){
		company = companyS.data[0];
		return _this.crudBranch.find({ _id: invoice.client.branch._id });
	})
	//busco branch
	.then(function(branchS){
		branch = branchS.data[0];
		return _this.user.getAdminUsers();
	})
	.then(function(users){
		emails = emails.concat([ invoice.client.account.email ]);
		for(var i = 0; i < users.data.length; i++){
			cc.push(users.data[i].account.email);
		}
		fileNamePdf = invoice.invoiceNumber + '.pdf';
		urlPdf = _this.dirname + '/api/invoices/' + fileNamePdf; 
		return pdf.createInvoice(invoice, company, branch);
	})
	.then(function(){
		return mail.sendInvoice(invoice, emails, cc, urlPdf, fileNamePdf);
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
	var invoice = {};
	var emails = [];
	_this.crud.find({ _id: id })
	.then(function(invoiceS){
		invoice = invoiceS.data[0];
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
		return mail.sendInvoiceUpdate(invoice, emails, username);
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

Invoice.prototype.createInvoice = function(id){
	var d = q.defer();
	var invoice = {};
	var company = {};
	var _this = this;
	var query = {
		_id: id
	};
	_this.crud.find(query)
	.then(function (result) {
		invoice = result.data[0];
		return _this.crudCompany.find({ _id: invoice.client.company._id });
	})
	.then(function (result) {
		company = result.data[0];
		return pdf.createInvoice(invoice, company);
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

Invoice.prototype.getInvoice = function(id, res){
	this.createInvoice(id)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType("application/pdf");
			res.send(data);
		});
	});
};

Invoice.prototype.getMonthlyStatement = function(params, user){
	var d = q.defer();
	var _this = this;
	var today = new Date();
	var fromDate = params.from ? new Date(params.from) : new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
	var toDate = params.to ? new Date(params.to) : new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

	var pipeline = [];

	var project = {
		$project: {
			_id: 1,
			client: {
				_id: '$client._id',
				name: '$client.entity.fullName'
			},
			date: 1,
			unitno: 1,
			pono: 1,
			invoiceNumber: 1,
			total: 1,
			status: {
				_id: '$status._id',
				description: '$status._id'
			},
			statusPaid: {
				_id: {
					$cond: [{ $eq: ['$status._id', 4] }, 4, 1]
				},
				description: {
					$cond: [{ $eq: ['$status._id', 4] }, 'Paid', 'Pending']
				}
			},
			year: {
				$year: '$date'
			},
			month: {
				$month: '$date'
			},
			branch: {
				_id: '$client.branch._id',
				name: '$client.branch.name'
			},
			company: {
				_id: '$client.company._id',
				name: '$client.company.entity.name',
				address: '$client.company.address'
			}
		}
	};

	var sort = {
		$sort: {
			date: 1
		}
	}

	var query = {
		$match: {}
	};
	if(params.clientId){
		query.$match['client._id'] = Number(params.clientId);
	}
	if(params.companyId){
		query.$match['company._id'] = Number(params.companyId);
	}
	if(params.branchId){
		query.$match['branch._id'] = Number(params.branchId);
	}

	var group = {
		$group: {
			_id: {
				year: '$year',
				month: '$month',
				status: '$statusPaid'
			},
			total: {
				$sum: '$total'
			},
			invoices: {
				$push: '$$ROOT'
			}
		}
	};

	var project2 = {
		$project: {
			_id: 0,
			year: '$_id.year',
			month: '$_id.month',
			status: '$_id.status',
			total: '$total',
			invoices: '$invoices'
		}
	};

	var sort1 = {
		$sort: {
			year: 1,
			month: 1
		}
	};
	console.log(query)
	pipeline.push(project);
	pipeline.push(sort);
	pipeline.push(query);
	pipeline.push(group);
	pipeline.push(project2);
	pipeline.push(sort1);

	_this.crud.db.get('INVOICE').aggregate(pipeline, function(error, data){
		if(error){
			d.reject(error);
			throw new Error("Error happened: ", error);
		}
		d.resolve(data);
	});
	return d.promise;
};


module.exports = Invoice;
