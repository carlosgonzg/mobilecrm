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

function DeliveryOrder(db, userLogged, dirname) {
	this.crud = new Crud(db, 'DELIVERYORDER', userLogged);
	this.crudInvoice = new Crud(db, 'INVOICE', userLogged);
	this.user = new User(db, '', userLogged);
	this.crew = new Crud(db, 'USER', userLogged);

	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id: '/DeliveryOrder',
		type: 'object',
		properties: {
			client: {
				type: 'object',
				required: false
			},
			date: {
				type: 'date',
				required: false
			},
			invoiceNumber: {
				type: 'string',
				required: false
			},
			dor: {
				type: 'string',
				required: true
			},
			siteAddressFrom: new Address().schema,
			siteAddressTo: new Address().schema,
			phone: {
				type: 'object',
				required: false
			},
			items: {
				type: 'array',
				required: false,
				items: new Item().schema
			},
			comment: {
				type: 'string',
				required: false
			},
			total: {
				type: 'int',
				required: false
			},
			typeTruck: {
				type: 'object',
				required: true
			},
			status: {
				type: 'object',
				required: true
			},
			pickupDate: {
				type: 'date',
				required: true
			},
			pickupTime: {
				type: 'date',
				required: false
			},
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = ['dor'];
}

DeliveryOrder.prototype.savePhotos = function (deliveryOrder) {
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads';
	var deliveryOrderDir = dirname + '/' + deliveryOrder._id;
	if (deliveryOrder.photos && deliveryOrder.photos.length > 0) {
		var urlPhotos = [];
		for (var i = 0; i < deliveryOrder.photos.length; i++) {
			var photo = deliveryOrder.photos[i];
			//chequeo que existe la carpeta del service order, si no la creo
			if (!fs.existsSync(deliveryOrderDir)) {
				fs.mkdirSync(deliveryOrderDir);
			}
			//chequeo que existe la foto, si no la creo y cambio el url de la foto por el relative path
			var fileDir = deliveryOrderDir + '/' + photo.name;
			if (!fs.existsSync(fileDir)) {
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urlPhotos.push({
					id: i,
					url: '/images/uploads/' + deliveryOrder._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for (var i = 0; i < urlPhotos.length; i++) {
			for (var j = 0; j < deliveryOrder.photos.length; j++) {
				if (urlPhotos[i].id == j) {
					deliveryOrder.photos[j].url = urlPhotos[i].url.toString();
					break;
				}
			}
		}
		d.resolve(deliveryOrder.photos);
	}
	else {
		d.resolve([]);
	}
	return d.promise;
};

DeliveryOrder.prototype.insert = function (deliveryOrder, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];
	var sendMail = deliveryOrder.sendMail || false;
	var sendMailTech = deliveryOrder.sendTotech || false;


	if (sendMailTech == true) {
		/*
		busco los email de los crew leader - fz
			for (var row = 0; row < deliveryOrder.items.length; row++) {
					if (deliveryOrder.items[row].crewLeaderCol != undefined) {
						var element = deliveryOrder.items[row].crewLeaderCol.id
						userIds.push(element);
					}
				} */

		//busco los id de los los tech en el cuerpo de la orden
		for (var n = 0; n < deliveryOrder.crewHeader.length; n++) {
			if (deliveryOrder.crewHeader != undefined) {
				var element = deliveryOrder.crewHeader[n].id
				userIds.push(element);
			}
		}
		this.crew.find({ _id: { $in: userIds } })
			.then(function (data) {
				crewdata = data
			})
	}

	//sumo el total
	for (var i = 0; i < deliveryOrder.items.length; i++) {
		var qtity = deliveryOrder.items[i].quantity;
		var InitPrice = deliveryOrder.items[i].price;

		if (deliveryOrder.items[i]._id == 789) {
			if (qtity <= 30) {
				total += InitPrice;
			} else {
				var minMiles = 30;
				var miles = qtity;
				var miles30 = 0;
				total += (miles - minMiles) * 3.25 + (InitPrice)
			}
		} else {
			total += qtity * InitPrice;
		}
	}

	deliveryOrder.total = total;
	var photos = deliveryOrder.photos;
	//Consigo el sequencial de invoice
	var promise = deliveryOrder.invoiceNumber ? q.when(deliveryOrder.invoiceNumber) : q.when('Pending Invoice');
	promise
		.then(function (sequence) {
			deliveryOrder.invoiceNumber = sequence;
			delete deliveryOrder.sendMail;
			delete deliveryOrder.photos;
			//inserto
			return _this.crud.insert(deliveryOrder);
		})
		//Guardando las fotos
		.then(function (obj) {
			deliveryOrder._id = obj.data._id;
			deliveryOrder.photos = photos;
			return _this.savePhotos(deliveryOrder);
		})
		//actualizo y mando correo
		.then(function (photos) {
			return _this.crud.update({ _id: deliveryOrder._id }, deliveryOrder)
		})
		.then(function (photos) {

			if (sendMail || sendMailTech || user.role._id == 1)
				_this.sendDeliveryOrder(deliveryOrder._id, user, mail, crewdata, sendMail, sendMailTech);
			d.resolve(deliveryOrder);
		})
		.catch(function (err) {
			console.log(err)
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
};

DeliveryOrder.prototype.update = function (query, deliveryOrder, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];
	var sendMail = deliveryOrder.sendMail || false;
	var sendMailTech = deliveryOrder.sendTotech || false;

	if (sendMailTech == true) {
		/*
		//busco los email de los crew leader - fz
		for (var row = 0; row < deliveryOrder.items.length; row++) {
					if (deliveryOrder.items[row].crewLeaderCol != undefined) {
						var element = deliveryOrder.items[row].crewLeaderCol.id
						userIds.push(element);
					}
				} */

		//busco los id de los los tech en el cuerpo de la orden
		for (var n = 0; n < deliveryOrder.crewHeader.length; n++) {
			if (deliveryOrder.crewHeader != undefined) {
				var element = deliveryOrder.crewHeader[n].id
				userIds.push(element);
			}
		}
		this.crew.find({ _id: { $in: userIds } })
			.then(function (data) {
				crewdata = data
			})
	}

	//sumo el total
	for (var i = 0; i < deliveryOrder.items.length; i++) {
		var qtity = deliveryOrder.items[i].quantity;
		var InitPrice = deliveryOrder.items[i].price;

		if (deliveryOrder.items[i]._id == 789) {
			if (qtity <= 30) {
				total += InitPrice;
			} else {
				var minMiles = 30;
				var miles = qtity;
				var miles30 = 0;
				total += (miles - minMiles) * 3.25 + (InitPrice)
			}
		} else {
			total += qtity * InitPrice;
		}
	}

	deliveryOrder.total = total;
	_this.savePhotos(deliveryOrder)
		.then(function (photos) {
			deliveryOrder.photos = photos;
			delete deliveryOrder.sendMail;

			var setObj = {};
			if ([5, 7].indexOf(deliveryOrder.status._id) != -1) {
				setObj = { invoiceNumber: "No Invoice" };
			}
			else {
				setObj = { invoiceNumber: deliveryOrder.invoiceNumber };
			}

			if (deliveryOrder.pono)
				setObj.pono = deliveryOrder.pono;
			if (deliveryOrder.unitno)
				setObj.unitno = deliveryOrder.unitno;
			if (deliveryOrder.items.length > 0)
				setObj.items = deliveryOrder.items;
			if (deliveryOrder.total)
				setObj.total = deliveryOrder.total;

			_this.crudInvoice.update({ sor: deliveryOrder.sor }, setObj, true);

			return _this.crud.update(query, deliveryOrder);
		})
		.then(function (obj) {
			if (sendMail || sendMailTech)
				_this.sendDeliveryOrderUpdate(query._id, user, mail, crewdata, sendMail, sendMailTech);
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

DeliveryOrder.prototype.sendDeliveryOrder = function (id, user, mail, crewdata, sendMail, sendMailTech) {
	var d = q.defer();
	var _this = this;
	var deliveryOrder = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	var emails = [];

	_this.crud.find({ _id: id })
		.then(function (orderS) {
			deliveryOrder = orderS.data[0];
			return _this.user.getAdminUsers();
		})
		.then(function (users) {
			if (sendMail == true) {
				emails = [deliveryOrder.client.account.email];
				for (var i = 0; i < users.data.length; i++) {
					emails.push(users.data[i].account.email);
				}
			}
			//AGREGO LOS EMAILS DE LOS TECNICOS AL ARREGLO EMAILS --FZ
			if (sendMailTech == true) {
				for (var row = 0; row < crewdata.data.length; row++) {
					emails.push(crewdata.data[row].account.email)
				}
			}
			emails = _.uniq(emails);
			return mail.sendDeliveryOrder(deliveryOrder, emails, _this.dirname);
		})
		.then(function () {
			d.resolve(true);
		})
		.catch(function (err) {
			console.log(err)
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
};

DeliveryOrder.prototype.sendDeliveryOrderUpdate = function (id, user, mail, crewdata, sendMail, sendMailTech) {
	var d = q.defer();
	var _this = this;
	var deliveryOrder = {};
	var emails = [];

	_this.crud.find({ _id: id })
		.then(function (orderS) {
			deliveryOrder = orderS.data[0];
			return _this.user.getAdminUsers();
		})
		.then(function (users) {
			emails = [];
			if (sendMail == true) {
				for (var i = 0; i < users.data.length; i++) {
					emails.push(users.data[i].account.email);
				}
			}

			//AGREGO LOS EMAILS DE LOS TECNICOS AL ARREGLO EMAILS --FZ
			if (sendMailTech == true) {
				for (var row = 0; row < crewdata.data.length; row++) {
					emails.push(crewdata.data[row].account.email)
				}
			}

			emails = _.uniq(emails);
			// //if(user.role._id != 1){
			// 	console.log("SERVICE ORDER UPDATE!!!", emails, deliveryOrder)
			return mail.sendDeliveryOrderUpdate(deliveryOrder, emails, user);
			//}
			//else{
			//	return q.when();
			//}
		})
		.then(function () {
			d.resolve(true);
		})
		.catch(function (err) {
			console.log(err)
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
};

DeliveryOrder.prototype.createDeliveryOrder = function (id, user) {
	var d = q.defer();
	var _this = this;
	var query = {
		_id: id
	};
	_this.crud.find(query)
		.then(function (result) {
			return pdf.createDeliveryOrder(result.data[0]);
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

DeliveryOrder.prototype.getDeliveryOrder = function (id, res, user) {
	this.createDeliveryOrder(id, user)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType("application/pdf");
				res.send(data);
			});
		});
};

DeliveryOrder.prototype.createReport = function (query, queryDescription) {
	var d = q.defer();
	var _this = this;
	_this.crud.find(query)
		.then(function (result) {
			return excel.createReport(result.data, 'DeliveryOrder', query, queryDescription);
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

DeliveryOrder.prototype.getReport = function (query, queryDescription, res) {
	this.createReport(query, queryDescription)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
				res.send(data);
			});
		});
};

DeliveryOrder.prototype.changeStatus = function (id) {
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


module.exports = DeliveryOrder;
