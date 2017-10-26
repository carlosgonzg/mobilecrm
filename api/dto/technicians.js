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
	this.crudInvoice = new Crud(db, 'INVOICE', userLogged);
	this.user = new User(db, '', userLogged);
	this.crew = new Crud(db, 'USER', userLogged);

	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id: '/ServiceOrder',
		type: 'object',
		properties: {
			client: {
				type: 'object',
				required: true
			},
			date: {
				type: 'date',
				required: true
			},
			invoiceNumber: {
				type: 'string',
				required: false
			},
			sor: {
				type: 'string',
				required: true
			},
			pono: {
				type: 'string',
				required: true
			},
			unitno: {
				type: 'string',
				required: true
			},
			isono: {
				type: 'string',
				required: true
			},
			siteAddress: new Address().schema,
			phone: {
				type: 'object',
				required: false
			},
			items: {
				type: 'array',
				required: true,
				items: new Item().schema
			},
			comment: {
				type: 'string',
				required: false
			},
			status: {
				type: 'object',
				required: true
			},
			total: {
				type: 'int',
				required: true
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = ['sor'];
}

ServiceOrder.prototype.savePhotos = function (serviceOrder) {
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads';
	var serviceOrderDir = dirname + '/' + serviceOrder._id;
	if (serviceOrder.photos && serviceOrder.photos.length > 0) {
		var urlPhotos = [];
		for (var i = 0; i < serviceOrder.photos.length; i++) {
			var photo = serviceOrder.photos[i];
			//chequeo que existe la carpeta del service order, si no la creo
			if (!fs.existsSync(serviceOrderDir)) {
				fs.mkdirSync(serviceOrderDir);
			}
			//chequeo que existe la foto, si no la creo y cambio el url de la foto por el relative path
			var fileDir = serviceOrderDir + '/' + photo.name;
			if (!fs.existsSync(fileDir)) {
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urlPhotos.push({
					id: i,
					url: '/images/uploads/' + serviceOrder._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for (var i = 0; i < urlPhotos.length; i++) {
			for (var j = 0; j < serviceOrder.photos.length; j++) {
				if (urlPhotos[i].id == j) {
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

ServiceOrder.prototype.update = function (query, serviceOrder, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];
	var sendMail = serviceOrder.sendMail || false;
	var sendMailTech = serviceOrder.sendTotech || false;

	//busco los email de los crew leader - fz
	if (sendMailTech == true) {
		for (var row = 0; row < serviceOrder.items.length; row++) {
			if (serviceOrder.items[row].crewLeaderCol != undefined) {
				var element = serviceOrder.items[row].crewLeaderCol.id
				userIds.push(element);
			}
		}
		for (var n = 0; n < serviceOrder.crewHeader.length; n++) {
			if (serviceOrder.crewHeader != undefined) {  //busco los id de los los tech en el cuerpo de la orden
				var element = serviceOrder.crewHeader[n].id
				userIds.push(element);
			}
		}
		this.crew.find({ _id: { $in: userIds } })
			.then(function (data) {
				crewdata = data
			})
	}

	//sumo el total
	for (var i = 0; i < serviceOrder.items.length; i++) {
		total += serviceOrder.items[i].quantity * serviceOrder.items[i].price;
	}

	serviceOrder.total = total;
	_this.savePhotos(serviceOrder)
		.then(function (photos) {
			serviceOrder.photos = photos;
			delete serviceOrder.sendMail;

			var setObj = {};
			if ([5, 7].indexOf(serviceOrder.status._id) != -1) {
				setObj = { invoiceNumber: "No Invoice" };
			}
			else {
				setObj = { invoiceNumber: serviceOrder.invoiceNumber };
			}

			if (serviceOrder.pono)
				setObj.pono = serviceOrder.pono;
			if (serviceOrder.unitno)
				setObj.unitno = serviceOrder.unitno;
			if (serviceOrder.items.length > 0)
				setObj.items = serviceOrder.items;
			if (serviceOrder.total)
				setObj.total = serviceOrder.total;

			_this.crudInvoice.update({ sor: serviceOrder.sor }, setObj, true);

			return _this.crud.update(query, serviceOrder);
		})
		.then(function (obj) {
			if (sendMail || sendMailTech)
				_this.sendServiceOrderUpdate(query._id, user, mail, crewdata, sendMail, sendMailTech);
			d.resolve(obj);
		})
		.catch(function (err) {
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
};

ServiceOrder.prototype.getServiceOrder = function (id, res, user) {
	this.createServiceOrder(id, user)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType("application/pdf");
				res.send(data);
			});
		});
};

ServiceOrder.prototype.createReport = function (query, queryDescription) {
	var d = q.defer();
	var _this = this;
	_this.crud.find(query)
		.then(function (result) {
			return excel.createReport(result.data, 'ServiceOrder', query, queryDescription);
		})
		.then(function (data) {
			d.resolve(data);
		})
		.catch(function (err) {
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
};

ServiceOrder.prototype.getReport = function (query, queryDescription, res) {
	this.createReport(query, queryDescription)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
				res.send(data);
			});
		});
};

ServiceOrder.prototype.changeStatus = function (id) {
	var d = q.defer();
	var _this = this;
	_this.crud.find({ _id: Number(id) })
		.then(function (result) {
			var obj = result.data[0];
			if (obj.status._id == 3) {
				obj.status = {
					_id: 4,
					description: 'Paid'
				};
			}
			else {
				obj.status = {
					_id: 3,
					description: 'Completed'
				};
			}
			return _this.crud.update({ _id: Number(id) }, obj);
		})
		.then(function (result) {
			d.resolve(true);
		})
		.catch(function (err) {
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
};


module.exports = ServiceOrder;
