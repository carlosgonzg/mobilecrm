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

function WorkOrder(db, userLogged, dirname) {
	this.crud = new Crud(db, 'WORKORDER', userLogged);
	this.user = new User(db, 'USER', userLogged);
	this.crudCompany = new Crud(db, 'COMPANY', userLogged);
	this.crudBranch = new Crud(db, 'BRANCH', userLogged);
	this.dirname = dirname;
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
			wor : {
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

WorkOrder.prototype.savePhotos = function(workOrder){
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads/workOrders';
	var workOrderDir = dirname + '/' + workOrder._id;
	if(workOrder.photos && workOrder.photos.length > 0){
		var urlPhotos = [];
		for(var i = 0; i < workOrder.photos.length; i++){
			var photo = workOrder.photos[i];
			//chequeo que existe la carpeta del work order, si no la creo
			if(!fs.existsSync(workOrderDir)){
				fs.mkdirSync(workOrderDir);
			}
			//chequeo que existe la foto, si no la creo y cambio el url de la foto por el relative path
			var fileDir = workOrderDir + '/' + photo.name;
			if(!fs.existsSync(fileDir)){
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urlPhotos.push({
					id: i,
					url: '/images/uploads/workOrders/' + workOrder._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for(var i = 0; i < urlPhotos.length; i++){
			for(var j = 0; j < workOrder.photos.length; j++){
				if(urlPhotos[i].id == j){
					workOrder.photos[j].url = urlPhotos[i].url.toString();
					break;
				}
			}
		}
		d.resolve(workOrder.photos);
	}
	else {
		d.resolve([]);
	}
	return d.promise;
};

WorkOrder.prototype.insert = function (workOrder, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < workOrder.items.length; i++) {
		total += workOrder.items[i].quantity * workOrder.items[i].price;
	}
	workOrder.total = total;
	var photos = workOrder.photos;
	//Consigo el sequencial de invoice
	var promise = workOrder.invoiceNumber ? q.when(workOrder.invoiceNumber) : util.getYearlySequence(_this.crud.db, 'WorkOrder');
	promise
	.then(function (sequence) {
		workOrder.invoiceNumber = sequence;
		delete workOrder.photos;
		//inserto
		return _this.crud.insert(workOrder);
	})
	//Guardando las fotos
	.then(function (obj) {
		workOrder._id = obj.data._id;
		workOrder.photos = photos;
		return _this.savePhotos(workOrder);
	})
	//actualizo y mando correo
	.then(function (photos) {
		return _this.crud.update({ _id: workOrder._id }, workOrder)
	})
	.then(function (photos) {
		var mails = [ workOrder.client.account.email ];
		_this.sendWorkOrder(workOrder._id,mails , user, mail);
		d.resolve(workOrder);
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

WorkOrder.prototype.update = function (query, workOrder, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < workOrder.items.length; i++) {
		total += workOrder.items[i].quantity * workOrder.items[i].price;
	}
	workOrder.total = total;
	_this.savePhotos(workOrder)
	.then(function (photos) {
		workOrder.photos = photos;
		return _this.crud.update(query, workOrder);
	})
	.then(function (obj) {
		_this.sendWorkOrderUpdate(query._id, user, mail);
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

WorkOrder.prototype.sendWorkOrder = function(id, emails, user, mail){
	var d = q.defer();
	var _this = this;
	var workOrder = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	emails = emails || [];
	_this.crud.find({ _id: id })
	.then(function(workOrderS){
		workOrder = workOrderS.data[0];
		return _this.user.getAdminUsers();
	})
	.then(function(users){
		emails = emails.concat([ workOrder.client.account.email ]);
		for(var i = 0; i < users.data.length; i++){
			emails.push(users.data[i].account.email);
		}
		return _this.createWorkOrder(id, user);
	})
	.then(function(data){
		return mail.sendWorkOrder(workOrder, emails, _this.dirname, data.path, data.fileName);
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

WorkOrder.prototype.sendWorkOrderUpdate = function(id, user, mail){
	var d = q.defer();
	var _this = this;
	var workOrder = {};
	var emails = [];
	_this.crud.find({ _id: id })
	.then(function(orderS){
		workOrder = orderS.data[0];
		return _this.user.getAdminUsers();
	})
	.then(function(users){
		emails = [ ];
		for(var i = 0; i < users.data.length; i++){
			emails.push(users.data[i].account.email);
		}
		if(user.role._id != 1)
			return mail.sendWorkOrderUpdate(workOrder, emails, user);
		else
			q.when();
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

WorkOrder.prototype.createWorkOrder = function(id, user){
	var d = q.defer();
	var _this = this;
	var workOrder = {};
	var company = {};
	var branch = {};
	var query = {
		_id: id
	};
	_this.crud.find(query)
	.then(function (workOrderS) {
		workOrder = workOrderS.data[0];
		return _this.crudCompany.find({ _id: workOrder.client.company._id });
	})
	.then(function (companyS) {
		company = companyS.data[0];
		return pdf.createWorkOrder(workOrder, company);
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

WorkOrder.prototype.getWorkOrder = function(id, res, user){
	this.createWorkOrder(id, user)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType("application/pdf");
			res.send(data);
		});
	});
};


module.exports = WorkOrder;
