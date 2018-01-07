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
	this.company = new Crud(db, 'COMPANY', userLogged);
	this.user = new User(db, '', userLogged);

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
			pono: {
				type: 'string',
				required: false
			},
			unitno: {
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
			clientcomment: {
				type: 'string',
				required: false
			},
			drivercomments: {
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
			ServiceType: {
				type: 'object',
				required: true
			},
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = ['dor'];
}

DeliveryOrder.prototype.savePhotos = function (deliveryOrder) {
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads/deliveryOrder';
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
					url: '/images/uploads/deliveryOrder/' + deliveryOrder._id + '/' + photo.name
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

DeliveryOrder.prototype.saveDocs = function (deliveryOrder) {
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads/deliveryOrder';
	var deliveryOrderDir = dirname + '/' + deliveryOrder._id;
	if (deliveryOrder.docs && deliveryOrder.docs.length > 0) {
		var urldocs = [];
		for (var i = 0; i < deliveryOrder.docs.length; i++) {
			var photo = deliveryOrder.docs[i];
			//chequeo que existe la carpeta exista
			if (!fs.existsSync(deliveryOrderDir)) {
				fs.mkdirSync(deliveryOrderDir);
			}
			//chequeo que existe el doc, si no la creo y cambio el url del doc por el relative path
			var fileDir = deliveryOrderDir + '/' + photo.name;
			if (!fs.existsSync(fileDir)) {
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urldocs.push({
					id: i,
					url: '/images/uploads/deliveryOrder/' + deliveryOrder._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for (var i = 0; i < urldocs.length; i++) {
			for (var j = 0; j < deliveryOrder.docs.length; j++) {
				if (urldocs[i].id == j) {
					deliveryOrder.docs[j].url = urldocs[i].url.toString();
					break;
				}
			}
		}
		d.resolve(deliveryOrder.docs);
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
	var InitPrice = 0;
	var initialMile = 30;
	var costPerMile = 3.25;
	var costPerHours = 0;
	var sendMail = deliveryOrder.sendMail || false;
	var comp = deliveryOrder.client.company;

	for (var index = 0; index < deliveryOrder.items.length; index++) {
		InitPrice = deliveryOrder.items[index].price;

		if (comp == undefined) {
			var miles = (deliveryOrder.items[index].quantity || 1);;

			if (deliveryOrder.items[index]._id == 805) {
				if (miles > 30) {
					total += (miles - initialMile) * costPerMile + (deliveryOrder.items[index].price)
				} else {
					total += deliveryOrder.items[index].price
				}
			} else {
				total += (deliveryOrder.items[index].price * (miles || 1));
			}
		}
		if (deliveryOrder.items[index]._id == 806 || deliveryOrder.items[index]._id == 805) {
			if (comp.perHours != undefined) {
				if (comp.perHours == false && comp.initialCost != undefined) {
					InitPrice = comp.initialCost;
					initialMile = comp.initialMile;
					costPerMile = comp.costPerMile;
				} else {
					if (deliveryOrder.typeTruck._id == 1) {
						costPerHours = comp.costPerHours;
					} else {
						costPerHours = comp.smallTruck;
					}
				}
			}
		}
		if (deliveryOrder.items[index]._id == 805 && costPerHours == 0) {
			if (deliveryOrder.items[index].quantity <= initialMile) {
				total += InitPrice
			} else {
				var minMiles = initialMile;
				var miles = deliveryOrder.items[index].quantity;

				total += (miles - minMiles) * costPerMile + (InitPrice)
			}
		} else if (deliveryOrder.items[index]._id == 806 && costPerHours > 0) {
			total += (costPerHours * (deliveryOrder.items[index].quantity || 1));
		} else {
			total += (deliveryOrder.items[index].price * (deliveryOrder.items[index].quantity || 1));
		}
	}

	deliveryOrder.total = total;

	var photos = deliveryOrder.photos;
	var docs = deliveryOrder.docs;

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
		//Guardando los documentos
		.then(function (obj) {
			deliveryOrder.docs = docs;
			return _this.saveDocs(deliveryOrder);
		})
		//actualizo y mando correo
		.then(function (photos) {
			return _this.crud.update({ _id: deliveryOrder._id }, deliveryOrder)
		})
		.then(function (photos) {

			if (sendMail || user.role._id == 1)
				_this.sendDeliveryOrder(deliveryOrder._id, user, mail, sendMail);
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
	var InitPrice = 0;
	var initialMile = 30;
	var costPerMile = 3.25;
	var costPerHours = 0;
	var sendMail = deliveryOrder.sendMail || false;
	var comp = deliveryOrder.client.company;

	for (var index = 0; index < deliveryOrder.items.length; index++) {
		InitPrice = deliveryOrder.items[index].price;

		if (comp == undefined) {
			var miles = (deliveryOrder.items[index].quantity || 1);;

			if (deliveryOrder.items[index]._id == 805) {
				if (miles > 30) {
					total += (miles - initialMile) * costPerMile + (deliveryOrder.items[index].price)
				} else {
					total += deliveryOrder.items[index].price
				}
			} else {
				total += (deliveryOrder.items[index].price * (miles || 1));
			}
		}
		if (deliveryOrder.items[index]._id == 806 || deliveryOrder.items[index]._id == 805) {
			if (comp.perHours != undefined) {
				if (comp.perHours == false && comp.initialCost != undefined) {
					InitPrice = comp.initialCost;
					initialMile = comp.initialMile;
					costPerMile = comp.costPerMile;
				} else {
					if (deliveryOrder.typeTruck._id == 1) {
						costPerHours = comp.costPerHours;
					} else {
						costPerHours = comp.smallTruck;
					}
				}
			}
		}
		if (deliveryOrder.items[index]._id == 805 && costPerHours == 0) {
			if (deliveryOrder.items[index].quantity <= initialMile) {
				total += InitPrice
				deliveryOrder.items[index].price = InitPrice
			} else {
				var minMiles = initialMile;
				var miles = deliveryOrder.items[index].quantity;

				total += (miles - minMiles) * costPerMile + (InitPrice)
			}
		} else if (deliveryOrder.items[index]._id == 806 && costPerHours > 0) {
			total += (costPerHours * (deliveryOrder.items[index].quantity || 1));
		} else {
			total += (deliveryOrder.items[index].price * (deliveryOrder.items[index].quantity || 1));
		}
	}	

	deliveryOrder.total = total;
	delete deliveryOrder.sor

	_this.savePhotos(deliveryOrder)
		.then(function (photos) {
			deliveryOrder.photos = photos;
			delete deliveryOrder.sendMail;

			var setObj = {};
			if ([5].indexOf(deliveryOrder.status._id) != -1) {
				setObj = { invoiceNumber: "No Invoice" };
				deliveryOrder.invoiceNumber = "No Invoice"
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

			_this.crudInvoice.update({ dor: deliveryOrder.dor }, setObj, true);

			return _this.crud.update(query, deliveryOrder);
		})
	_this.saveDocs(deliveryOrder)
		.then(function (docs) {
			deliveryOrder.docs = docs;
			delete deliveryOrder.sendMail;

			var setObj = {};
			if ([5].indexOf(deliveryOrder.status._id) != -1) {
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

			_this.crudInvoice.update({ dor: deliveryOrder.dor }, setObj, true);

			return _this.crud.update(query, deliveryOrder);
		})
		.then(function (obj) {
			if (sendMail)
				_this.sendDeliveryOrderUpdate(query._id, user, mail, sendMail);
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

DeliveryOrder.prototype.sendDeliveryOrder = function (id, user, mail, sendMail) {
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
				emails = _.uniq(emails);
				return mail.sendDeliveryOrder(deliveryOrder, emails, _this.dirname);
			}
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

DeliveryOrder.prototype.sendDeliveryOrderUpdate = function (id, user, mail, sendMail) {
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
				emails = _.uniq(emails);
				return mail.sendDeliveryOrderUpdate(deliveryOrder, emails, user);
			}
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


DeliveryOrder.prototype.sendDeliveryOrderDelete = function (id, user, mail, DeliveryOrder) {
	var d = q.defer();
	var _this = this;
	var emails = [];

	_this.user.getAdminUsers()
		.then(function (users) {
			emails = [];
			for (var i = 0; i < users.data.length; i++) {
				emails.push(users.data[i].account.email);
			}

			emails = _.uniq(emails);
			return mail.sendDeliveryOrderDelete(DeliveryOrder, emails, user);
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

module.exports = DeliveryOrder;