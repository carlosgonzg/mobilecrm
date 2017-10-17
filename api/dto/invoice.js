'use strict';

var q = require('q');
var Crud = require('./crud');
var Address = require('./address');
var Company = require('./company');
var Item = require('./item');
var _ = require('underscore');
var util = require('./util');
var excel = require('../excel');
var moment = require('moment');
var User = require('./user');
var pdf = require('../pdf');
var fs = require('fs')

function Invoice(db, userLogged, dirname) {
	this.crud = new Crud(db, 'INVOICE', userLogged);
	this.crudCompany = new Crud(db, 'COMPANY', userLogged);
	this.company = new Company(db, userLogged);
	this.crudBranch = new Crud(db, 'BRANCH', userLogged);
	this.crudServiceOrder = new Crud(db, 'SERVICEORDER', userLogged);
	this.crudWorkOrder = new Crud(db, 'WORKORDER', userLogged);
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
				required : false
			},
			wor : {
				type : 'string',
				required : false
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
			siteAddress : new Address(false).schema,
			phone : {
				type : 'object',
				required : false
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
	var promise = invoice.invoiceNumber ? q.when(invoice.invoiceNumber) : _this.company.getSequence(invoice.client.company._id, false);//util.getYearlySequence(_this.crud.db, 'Invoice');
	promise
	.then(function (sequence) {
		invoice.invoiceNumber = sequence;
		return _this.crud.insert(invoice, invoice.invoiceNumber == 'Pending Invoice');
	})
	.then(function (obj) {
		if (invoice.invoiceNumber != "Pending Invoice") {
			_this.company.setSequence(invoice.client.company._id)
		}

		d.resolve(obj) ;
	})
	//inserto
	.then(function (obj) {
		//_this.sendInvoice(obj.data._id, username, mail);
		var setObj = { invoiceNumber: invoice.invoiceNumber };
		if(invoice.pono)
			setObj.pono = invoice.pono;
		if(invoice.sor){
			_this.crudServiceOrder.update({ sor: invoice.sor }, setObj);
		}
		else if(invoice.wor){
			_this.crudWorkOrder.update({ wor: invoice.wor }, setObj);
		}
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

Invoice.prototype.update = function (query, invoice, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < invoice.items.length; i++) {
		total += invoice.items[i].quantity * invoice.items[i].price;
	}
	invoice.total = total;
	_this.crud.update(query, invoice, invoice.invoiceNumber == 'Pending Invoice')
	.then(function (obj) {
		var setObj = { invoiceNumber: invoice.invoiceNumber };
		
		if(invoice.pono)
			setObj.pono = invoice.pono;
		if(invoice.unitno)
			setObj.unitno = invoice.unitno;
		if(invoice.items.length>0)
			setObj.items = invoice.items;
		if(invoice.total)
			setObj.total = invoice.total;
		
		if(invoice.sor){
			_this.crudServiceOrder.update({ sor: invoice.sor }, setObj, true);
		}
		else if(invoice.wor){
			_this.crudWorkOrder.update({ wor: invoice.wor }, setObj, true)
		}
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

Invoice.prototype.sendInvoice = function(id, username, mail, emails, sendToAllAdmin){
	console.log("SEND INVOICEEEE", emails, sendToAllAdmin)
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
		return invoice.client.branch && invoice.client.branch._id  ? _this.crudBranch.find({ _id: invoice.client.branch._id }) : q.when({ data:[{ name: 'None'}] });
	})
	//busco branch
	.then(function(branchS){
		branch = branchS.data[0];
		return _this.user.getAdminUsers(sendToAllAdmin ? true : (invoice.pono ? true : false));
	})
	.then(function(users){
		emails = emails.concat([ invoice.client.account.email ]);
		for(var i = 0; i < users.data.length; i++){
			cc.push(users.data[i].account.email);
		}
		emails = _.uniq(emails);
		cc = _.uniq(cc);
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

Invoice.prototype.getReport = function(query, queryDescription, res){
	
	this.createReport(query, queryDescription)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.send(data);
		});
	});
};

Invoice.prototype.createReport = function(query, queryDescription){
	var d = q.defer();
	var _this = this;
	_this.crud.find(query)
	.then(function (result) {
		return excel.createReport(result.data, 'Invoice', query, queryDescription);
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
	var queryDate = {
		$gte: fromDate,
		$lte: toDate
	};
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
				description: '$status.description'
			},
			statusPaid: {
				_id: {
					$cond: [{ $eq: ['$status._id', 4] }, 4, {$cond:[{ $eq: ['$status._id', 3] }, 3, 1] }]
				},
				description: {
					$cond: [{ $eq: ['$status._id', 4] }, 'Paid', {$cond:[{ $eq: ['$status._id', 3] }, 'Pending to Pay', 'Pending'] }]
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
				address: '$client.company.address',
				taxes: '$client.company.taxes'
			},
			itemType: 1,
			taxes: {
				$ifNull: ['$client.company.taxes',0]
			},
			totalWithTaxes: {
				$add: [{$multiply: ['$total',{$ifNull:['$client.company.taxes',0]}]},{$ifNull:['$total',0]}]
			}
		}
	};

	var sort = {
		$sort: 
		{
			date: 1,
			'company._id': 1,
			'branch._id': 1,
			'client._id': 1
		}
	}

	var query = {
		$match: {
			date: {
				$gte: fromDate,
				$lte: toDate
			}
		}
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
			totalWithTaxes: {
				$sum: '$totalWithTaxes'
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
			totalWithTaxes: '$totalWithTaxes',
			invoices: '$invoices'
		}
	};

	var sort1 = {
		$sort: {
			year: 1,
			month: 1
		}
	};
	pipeline.push(project);
	pipeline.push(query);
	pipeline.push(sort);
	pipeline.push(group);
	pipeline.push(project2);
	// pipeline.push(sort1);
	var results = [];
	var invoices = [];
	_this.crud.find({
		date: queryDate
	})

	.then(function(result){
		// invoices = _.map(result.data, function(obj){
		// 	return obj.invoiceNumber;
		// });
		// var array = _.map(result.data, function(element) { 
		//      return _.extend({}, element, { itemType: element.sor ? 'ServiceOrder' : 'WorkOrder'});
		// });
		// results = results.concat(array);
		/*
		return _this.crudServiceOrder.find({
			invoiceNumber: {
				$ne: invoices
			},
			date: queryDate
		});
	})
	.then(function(result){
		var array = _.map(result.data, function(element) { 
		     return _.extend({}, element, { itemType: 'ServiceOrder'});
		});
		results = results.concat(array);
		return _this.crudWorkOrder.find({
			invoiceNumber: {
					$ne: invoices
			},
			date: queryDate
		});
	})
	.then(function(result){
		var array = _.map(result.data, function(element) { 
		     return _.extend({}, element, { itemType: 'WorkOrder'});
		});
		results = results.concat(array);*/
		return _this.crud.db.get('REPORT').remove({});
	})
	.then(function(){
		var promise = [];
		for(var i = 0; i < results.length; i++){
			// promise.push(_this.crud.db.get('REPORT').insert(results[i]));
		}
		q.all(promise);
	})
	.then(function(){
		_this.crud.db.get('INVOICE').aggregate(pipeline, function(error, data){
			if(error){
				d.reject(error);
				throw new Error("Error happened: ", error);
			}
			d.resolve(data);
		});
	});
	return d.promise;
};

Invoice.prototype.createMonthlyStatement = function(params, format, user){
	var d = q.defer();
	var _this = this;
	var whoIs = {};
	var promise = params.clientId ? _this.user.crud.find({ _id: Number(params.clientId) }) : 
	           	  params.companyId ? _this.crudCompany.find({ _id: Number(params.companyId) }) : 
	           	  params.branchId ? _this.crudBranch.find({ _id: Number(params.branchId) }) :
	           	  q.when({ data: [{ _id: -1, name: 'MobileOne'}] });
	promise
	.then(function(res){
		var obj = res.data[0] || {};
		if(params.clientId){
			whoIs = {
				_id: obj._id,
				name: obj.entity.fullName
			};
		}
		else if(params.companyId){
			whoIs = {
				_id: obj._id,
				name: obj.entity.name
			};
		}
		else if(params.branchId){
			whoIs = {
				_id: obj._id,
				name: obj.name
			};
		}
		else {
			whoIs = {
				_id: obj._id,
				name: obj.name
			};
		}
		return _this.getMonthlyStatement(params, user);
	})
	.then(function(data){
		return format == 'pdf' ? pdf.createMonthlyStatement(data, whoIs, user) : excel.createMonthlyStatement(data, whoIs, user);
	})
	.then(function(data){
		d.resolve(data);
	})
	.fail(function(error){
		d.reject(error);
	});
	return d.promise;
};

Invoice.prototype.getMonthlyStatementFile = function(params, format, user, res){
	this.createMonthlyStatement(params, format, user)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType(format == 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.send(data);
		});
	});
};

Invoice.prototype.changeStatus = function(id){
	var d = q.defer();
	var _this = this;
	_this.crud.find({ _id: Number(id) })
	.then(function (result) {
		var obj = result.data[0];
		if(obj.status._id == 3){
			obj.status = {
				_id: 4,
				description: 'Paid'
			};
		}
		else{
			obj.status = {
				_id: 3,
				description: 'Completed'
			};
		}

		// return _this.crud.update({_id: Number(id)}, obj);
		return _this.crud.update({_id: Number(id)}, obj).then(function(result) {
			d.resolve(obj.status);
		});

	})
	.then(function (result) {
		d.resolve(true);
	})
	.catch (function (err) {
		d.reject({
			result : 'Not ok',
			errors : err
		});
	});
	return d.promise;
};

Invoice.prototype.getExpenses = function(){
	var d = q.defer();
	var _this = this;
	_this.crud.find({ expenses: { $exists: true } })
	.then(function (result) {
		var obj = [];
		for(var i = 0; i < result.data.length; i++){
			var inv = {
				_id: result.data[i]._id,
				invoiceNumber: result.data[i].invoiceNumber,
				document: result.data[i].sor || result.data[i].wor,
				clientId: result.data[i].client._id,
				client: result.data[i].client.entity.fullName,
				company: result.data[i].client.company.entity.name,
				branch: result.data[i].client.branch.name,
				items: result.data[i].items,
				expenses: result.data[i].expenses,
				totalIncome: 0,
				totalExpenses: 0,
				date: result.data[i].date
			};
			for(var j = 0; j < result.data[i].items.length; j++){
				inv.totalIncome += result.data[i].items[j].quantity * result.data[i].items[j].price;
			}
			for(var j = 0; j < result.data[i].expenses.length; j++){
				inv.totalExpenses += result.data[i].expenses[j].price;
			}
			obj.push(inv);
		}
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

Invoice.prototype.getExpensesByFilter = function (query, start, end) {
  var deferred = q.defer();
  var _crud = this.crud;
  var sort = {};	
  var where = {
    $and: [],
    expenses: { $exists: true } 
  };


  // Si no tengo start Buscar todas las citas desde hace un año, de lo contrario desde start
  if (!start) {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - 12);
    
  }
  where.$and.push({ 
    date: {
      '$gte': new Date(start)
    }
  });

  // Si especifican cual es la fecha de fin, buscar hasta la fecha fin
  if (end) {
    where.$and.push({ 
      date: {
        '$lte': new Date(end)
      }
    });
  }

  if (query) {
    for (var x in query) {
      where[x] = query[x];
    }
  }

  console.log(where.$and);

  _crud.find(where, sort)
  .then(function (result) {
    var obj = [];
		for(var i = 0; i < result.data.length; i++){
			var inv = {
				_id: result.data[i]._id,
				invoiceNumber: result.data[i].invoiceNumber,
				document: result.data[i].sor || result.data[i].wor,
				clientId: result.data[i].client._id,
				client: result.data[i].client.entity.fullName,
				company: result.data[i].client.company.entity.name,
				branch: result.data[i].client.branch.name,
				items: result.data[i].items,
				expenses: result.data[i].expenses,
				totalIncome: 0,
				totalExpenses: 0
			};
			for(var j = 0; j < result.data[i].items.length; j++){
				inv.totalIncome += result.data[i].items[j].quantity * result.data[i].items[j].price;
			}
			for(var j = 0; j < result.data[i].expenses.length; j++){
				inv.totalExpenses += result.data[i].expenses[j].price;
			}
			obj.push(inv);
		}
		console.log(obj)
		deferred.resolve(obj);
  }, function (err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

module.exports = Invoice;
