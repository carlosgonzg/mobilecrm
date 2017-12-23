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

function ServiceQuotes(db, userLogged, dirname) {
	this.crud = new Crud(db, 'SERVICEQUOTES', userLogged);
	this.crudInvoice = new Crud(db, 'INVOICE', userLogged);
	this.user = new User(db, '', userLogged);
	this.crew = new Crud(db, 'USER', userLogged);

	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id: '/serviceQuotes',
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
			},
			serviceType: {
				type: 'object',
				required: true
			},
			approved: {
				type: 'int',
				required: true
			},
			quotesNumber: {
				type: 'string',
				required: true
			},
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = ['quotesNumber'];
}

ServiceQuotes.prototype.savePhotos = function (serviceQuotes) {
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads';
	var serviceQuotesDir = dirname + '/' + serviceQuotes._id;
	if (serviceQuotes.photos && serviceQuotes.photos.length > 0) {
		var urlPhotos = [];
		for (var i = 0; i < serviceQuotes.photos.length; i++) {
			var photo = serviceQuotes.photos[i];
			//chequeo que existe la carpeta del service order, si no la creo
			if (!fs.existsSync(serviceQuotesDir)) {
				fs.mkdirSync(serviceQuotesDir);
			}
			//chequeo que existe la foto, si no la creo y cambio el url de la foto por el relative path
			var fileDir = serviceQuotesDir + '/' + photo.name;
			if (!fs.existsSync(fileDir)) {
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urlPhotos.push({
					id: i,
					url: '/images/uploads/' + serviceQuotes._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for (var i = 0; i < urlPhotos.length; i++) {
			for (var j = 0; j < serviceQuotes.photos.length; j++) {
				if (urlPhotos[i].id == j) {
					serviceQuotes.photos[j].url = urlPhotos[i].url.toString();
					break;
				}
			}
		}
		d.resolve(serviceQuotes.photos);
	}
	else {
		d.resolve([]);
	}
	return d.promise;
};

ServiceQuotes.prototype.insert = function (serviceQuotes, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];

	//sumo el total
	for (var i = 0; i < serviceQuotes.items.length; i++) {
		total += serviceQuotes.items[i].quantity * serviceQuotes.items[i].price;
	}
	serviceQuotes.total = total;
	var photos = serviceQuotes.photos;
	//Consigo el sequencial de invoice
	var promise = serviceQuotes.quotesNumber ? q.when(serviceQuotes.quotesNumber) : _this.company.getSequence(serviceQuotes.client.company._id, false, false, true);//util.getYearlySequence(_this.crud.db, 'Invoice');
	promise
		.then(function (sequence) {
			serviceQuotes.quotesNumber = sequence;
			delete serviceQuotes.sendMail;
			delete serviceQuotes.photos;
			//inserto
			return _this.crud.insert(serviceQuotes);
		})
		//Guardando las fotos
		.then(function (obj) {
			serviceQuotes._id = obj.data._id;
			serviceQuotes.photos = photos;
			return _this.savePhotos(serviceQuotes);
		})
		//actualizo y mando correo
		.then(function (photos) {
			return _this.crud.update({ _id: serviceQuotes._id }, serviceQuotes)
		})
		.then(function (photos) {
			d.resolve(serviceQuotes);
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

ServiceQuotes.prototype.update = function (query, serviceQuotes, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];

	//sumo el total
	for (var i = 0; i < serviceQuotes.items.length; i++) {
		total += serviceQuotes.items[i].quantity * serviceQuotes.items[i].price;
	}

	serviceQuotes.total = total;
	_this.savePhotos(serviceQuotes)
		.then(function (photos) {
			serviceQuotes.photos = photos;
			delete serviceQuotes.sendMail;

			var setObj = {};
			if ([5, 7].indexOf(serviceQuotes.status._id) != -1) {
				setObj = { invoiceNumber: "No Invoice" };
			}
			else {
				setObj = { invoiceNumber: serviceQuotes.invoiceNumber };
			}

			if (serviceQuotes.pono)
				setObj.pono = serviceQuotes.pono;
			if (serviceQuotes.unitno)
				setObj.unitno = serviceQuotes.unitno;
			if (serviceQuotes.items.length > 0)
				setObj.items = serviceQuotes.items;
			if (serviceQuotes.total)
				setObj.total = serviceQuotes.total;

			_this.crudInvoice.update({ quotesNumber: serviceQuotes.quotesNumber }, setObj, true);

			return _this.crud.update(query, serviceQuotes);
		})
		.then(function (obj) {
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

ServiceQuotes.prototype.sendServiceQuotes = function (id, username, mail, emails) {
	var d = q.defer();
	var _this = this;
	var serviceQuotes = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	var cc = [];
	var company = {};
	var branch = {};

	_this.crud.find({ _id: id })
		.then(function (orderS) {
			serviceQuotes = orderS.data[0];
			return _this.user.getAdminUsers();
		})
		//busco compañia
		.then(function (companyS) {
			company = companyS.data[0];
			return _this.company
		})
		.then(function (users) {
			if (serviceQuotes.saveSendTo == false) {
				emails = emails.concat([serviceQuotes.client.account.email]);
				for (var i = 0; i < users.data.length; i++) {
					cc.push(users.data[i].account.email);
				}
			}
			emails = _.uniq(emails);
			cc = _.uniq(cc);
			fileNamePdf = serviceQuotes.invoiceNumber + '.pdf';
			urlPdf = _this.dirname + '/api/quotes/' + fileNamePdf;
			return pdf.createInvoice(serviceQuotes, serviceQuotes.client.company, branch, true);
		})
		.then(function () {
			return mail.sendQuotes(serviceQuotes, emails, cc, urlPdf, fileNamePdf);
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

ServiceQuotes.prototype.sendServiceQuotesDelete = function (id, user, mail, serviceQuotes) {
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
			return mail.sendServiceQuotesDelete(serviceQuotes, emails, user);
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

module.exports = ServiceQuotes;
