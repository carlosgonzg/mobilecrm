'use strict';

var q = require('q');
var Crud = require('./crud');
var Address = require('./address');
var Item = require('./item');
var _ = require('underscore');
var util = require('./util');
var excel = require('../excel');
var moment = require('moment');
var User = require('./user');
var pdf = require('../pdf');
var fs = require('fs')

function ServiceOrder(db, userLogged, dirname) {
	this.crud = new Crud(db, 'SERVICEORDER', userLogged);
	this.user = new User(db, '', userLogged);
	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id : '/ServiceOrder',
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
				required : false
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
	this.crud.uniqueFields = ['sor'];
}

ServiceOrder.prototype.savePhotos = function(serviceOrder){
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads';
	var serviceOrderDir = dirname + '/' + serviceOrder._id;
	if(serviceOrder.photos && serviceOrder.photos.length > 0){
		var urlPhotos = [];
		for(var i = 0; i < serviceOrder.photos.length; i++){
			var photo = serviceOrder.photos[i];
			//chequeo que existe la carpeta del service order, si no la creo
			if(!fs.existsSync(serviceOrderDir)){
				fs.mkdirSync(serviceOrderDir);
			}
			//chequeo que existe la foto, si no la creo y cambio el url de la foto por el relative path
			var fileDir = serviceOrderDir + '/' + photo.name;
			if(!fs.existsSync(fileDir)){
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urlPhotos.push({
					id: i,
					url: '/images/uploads/' + serviceOrder._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for(var i = 0; i < urlPhotos.length; i++){
			for(var j = 0; j < serviceOrder.photos.length; j++){
				if(urlPhotos[i].id == j){
					serviceOrder.photos[j].url = urlPhotos[i].url.toString();
					break;
				}
			}
		}
		d.resolve(serviceOrder.photos);
	}
	else {
		d.resolve([]);
	}
	return d.promise;
};

ServiceOrder.prototype.insert = function (serviceOrder, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var sendMail = serviceOrder.sendMail || false;
	//sumo el total
	for (var i = 0; i < serviceOrder.items.length; i++) {
		total += serviceOrder.items[i].quantity * serviceOrder.items[i].price;
	}
	serviceOrder.total = total;
	var photos = serviceOrder.photos;
	//Consigo el sequencial de invoice
	var promise = serviceOrder.invoiceNumber ? q.when(serviceOrder.invoiceNumber) : q.when('Pending Invoice');
	promise
	.then(function (sequence) {
		serviceOrder.invoiceNumber = sequence;
		delete serviceOrder.sendMail;
		delete serviceOrder.photos;
		//inserto
		return _this.crud.insert(serviceOrder);
	})
	//Guardando las fotos
	.then(function (obj) {
		serviceOrder._id = obj.data._id;
		serviceOrder.photos = photos;
		return _this.savePhotos(serviceOrder);
	})
	//actualizo y mando correo
	.then(function (photos) {
		return _this.crud.update({ _id: serviceOrder._id }, serviceOrder)
	})
	.then(function (photos) {
		if(sendMail || user.role._id == 1)
			_this.sendServiceOrder(serviceOrder._id, user, mail);
		d.resolve(serviceOrder);
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

ServiceOrder.prototype.update = function (query, serviceOrder, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	//sumo el total
	for (var i = 0; i < serviceOrder.items.length; i++) {
		total += serviceOrder.items[i].quantity * serviceOrder.items[i].price;
	}
	var sendMail = serviceOrder.sendMail || false;
	serviceOrder.total = total;
	_this.savePhotos(serviceOrder)
	.then(function (photos) {
		serviceOrder.photos = photos;
		delete serviceOrder.sendMail;
		return _this.crud.update(query, serviceOrder);
	})
	.then(function (obj) {
		if(sendMail || user.role._id == 1)
			_this.sendServiceOrderUpdate(query._id, user, mail);
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

ServiceOrder.prototype.sendServiceOrder = function(id, user, mail){
	var d = q.defer();
	var _this = this;
	var serviceOrder = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	var emails = [];
	_this.crud.find({ _id: id })
	.then(function(orderS){
		serviceOrder = orderS.data[0];
		return _this.user.getAdminUsers();
	})
	.then(function(users){
		emails = [ serviceOrder.client.account.email ];
		for(var i = 0; i < users.data.length; i++){
			emails.push(users.data[i].account.email);
		}
		return mail.sendServiceOrder(serviceOrder, emails, _this.dirname);
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

ServiceOrder.prototype.sendServiceOrderUpdate = function(id, user, mail){
	var d = q.defer();
	var _this = this;
	var serviceOrder = {};
	var emails = [];
	_this.crud.find({ _id: id })
	.then(function(orderS){
		serviceOrder = orderS.data[0];
		return _this.user.getAdminUsers();
	})
	.then(function(users){
		emails = [ ];
		for(var i = 0; i < users.data.length; i++){
			emails.push(users.data[i].account.email);
		}
		emails = _.uniq(emails);
		if(user.role._id != 1){
			return mail.sendServiceOrderUpdate(serviceOrder, emails, user);
		}
		else{
			return q.when();
		}
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

ServiceOrder.prototype.createServiceOrder = function(id, user){
	var d = q.defer();
	var _this = this;
	var query = {
		_id: id
	};
	_this.crud.find(query)
	.then(function (result) {
		return pdf.createServiceOrder(result.data[0]);
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

ServiceOrder.prototype.getServiceOrder = function(id, res, user){
	this.createServiceOrder(id, user)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType("application/pdf");
			res.send(data);
		});
	});
};

ServiceOrder.prototype.createReport = function(query){
	var d = q.defer();
	var _this = this;
	_this.crud.find(query)
	.then(function (result) {
		return excel.createReport(result.data, 'ServiceOrder');
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

ServiceOrder.prototype.getReport = function(query, res){
	this.createReport(query)
	.then(function(obj){
		fs.readFile(obj.path, function (err,data){
			res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.send(data);
		});
	});
};

ServiceOrder.prototype.changeStatus = function(id){
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
		return _this.crud.update({_id: Number(id)}, obj);
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


module.exports = ServiceOrder;
