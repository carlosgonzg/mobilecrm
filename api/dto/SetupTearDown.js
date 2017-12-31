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

function SetupTearDown(db, userLogged, dirname) {
	this.crud = new Crud(db, 'SETUPTEARDOWN', userLogged);
	this.crudInvoice = new Crud(db, 'INVOICE', userLogged);
	this.user = new User(db, '', userLogged);
	this.crew = new Crud(db, 'USER', userLogged);

	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id: '/SetupTearDown',
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
			tor: {
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
	this.crud.uniqueFields = ['tor'];
}

SetupTearDown.prototype.savePhotos = function (SetupTearDown) {
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads';
	var SetupTearDownDir = dirname + '/' + SetupTearDown._id;
	if (SetupTearDown.photos && SetupTearDown.photos.length > 0) {
		var urlPhotos = [];
		for (var i = 0; i < SetupTearDown.photos.length; i++) {
			var photo = SetupTearDown.photos[i];
			//chequeo que existe la carpeta del service order, si no la creo
			if (!fs.existsSync(SetupTearDownDir)) {
				fs.mkdirSync(SetupTearDownDir);
			}
			//chequeo que existe la foto, si no la creo y cambio el url de la foto por el relative path
			var fileDir = SetupTearDownDir + '/' + photo.name;
			if (!fs.existsSync(fileDir)) {
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urlPhotos.push({
					id: i,
					url: '/images/uploads/' + SetupTearDown._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for (var i = 0; i < urlPhotos.length; i++) {
			for (var j = 0; j < SetupTearDown.photos.length; j++) {
				if (urlPhotos[i].id == j) {
					SetupTearDown.photos[j].url = urlPhotos[i].url.toString();
					break;
				}
			}
		}
		d.resolve(SetupTearDown.photos);
	}
	else {
		d.resolve([]);
	}
	return d.promise;
};

SetupTearDown.prototype.insert = function (SetupTearDown, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];
	var sendMail = SetupTearDown.sendMail || false;
	var sendMailTech = SetupTearDown.sendTotech || false;

	SetupTearDown.date = new Date()

	if (sendMailTech == true) {
		/*
		busco los email de los crew leader - fz
			for (var row = 0; row < SetupTearDown.items.length; row++) {
					if (SetupTearDown.items[row].crewLeaderCol != undefined) {
						var element = SetupTearDown.items[row].crewLeaderCol.id
						userIds.push(element);
					}
				} */

		//busco los id de los los tech en el cuerpo de la orden
		for (var n = 0; n < SetupTearDown.crewHeader.length; n++) {
			if (SetupTearDown.crewHeader != undefined) {
				var element = SetupTearDown.crewHeader[n].id
				userIds.push(element);
			}
		}
		this.crew.find({ _id: { $in: userIds } })
			.then(function (data) {
				crewdata = data
			})
	}

	//sumo el total
	for (var i = 0; i < SetupTearDown.items.length; i++) {
		total += SetupTearDown.items[i].quantity * SetupTearDown.items[i].price;
	}
	SetupTearDown.total = total;
	var photos = SetupTearDown.photos;
	//Consigo el sequencial de invoice
	var promise = SetupTearDown.invoiceNumber ? q.when(SetupTearDown.invoiceNumber) : q.when('Pending Invoice');
	promise
		.then(function (sequence) {
			SetupTearDown.invoiceNumber = sequence;
			delete SetupTearDown.sendMail;
			delete SetupTearDown.photos;
			//inserto
			return _this.crud.insert(SetupTearDown);
		})
		//Guardando las fotos
		.then(function (obj) {
			SetupTearDown._id = obj.data._id;
			SetupTearDown.photos = photos;
			return _this.savePhotos(SetupTearDown);
		})
		//actualizo y mando correo
		.then(function (photos) {
			return _this.crud.update({ _id: SetupTearDown._id }, SetupTearDown)
		})
		.then(function (photos) {
			if (sendMail || sendMailTech) {
				_this.sendSetupTearDown(SetupTearDown._id, user, mail, crewdata, sendMail, sendMailTech);
			}
			d.resolve(SetupTearDown);
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

SetupTearDown.prototype.update = function (query, SetupTearDown, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];
	var sendMail = SetupTearDown.sendMail || false;
	var sendMailTech = SetupTearDown.sendTotech || false;

	if (SetupTearDown.serviceType && SetupTearDown.serviceType._id == 3 && SetupTearDown.quotes == 1) {
		_this.insert(SetupTearDown, user, mail)
		return d.promise;
	}
	
	if (sendMailTech == true) {
		//busco los id de los los tech en el cuerpo de la orden
		for (var n = 0; n < SetupTearDown.crewHeader.length; n++) {
			if (SetupTearDown.crewHeader != undefined) {
				var element = SetupTearDown.crewHeader[n].id
				userIds.push(element);
			}
		}
		this.crew.find({ _id: { $in: userIds } })
			.then(function (data) {
				crewdata = data
			})
	}

	//sumo el total
	for (var i = 0; i < SetupTearDown.items.length; i++) {
		total += SetupTearDown.items[i].quantity * SetupTearDown.items[i].price;
	}

	SetupTearDown.total = total;
	_this.savePhotos(SetupTearDown)
		.then(function (photos) {
			SetupTearDown.photos = photos;
			delete SetupTearDown.sendMail;

			var setObj = {};
			if ([5, 7].indexOf(SetupTearDown.status._id) != -1) {
				setObj = { invoiceNumber: "No Invoice" };
			}
			else {
				setObj = { invoiceNumber: SetupTearDown.invoiceNumber };
			}

			if (SetupTearDown.pono)
				setObj.pono = SetupTearDown.pono;
			if (SetupTearDown.unitno)
				setObj.unitno = SetupTearDown.unitno;
			if (SetupTearDown.items.length > 0)
				setObj.items = SetupTearDown.items;
			if (SetupTearDown.total)
				setObj.total = SetupTearDown.total;

			_this.crudInvoice.update({ tor: SetupTearDown.tor }, setObj, true);

			return _this.crud.update(query, SetupTearDown);
		})
		.then(function (obj) {
			if (sendMail || sendMailTech)
				_this.sendSetupTearDownUpdate(query._id, user, mail, crewdata, sendMail, sendMailTech);
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

SetupTearDown.prototype.sendSetupTearDown = function (id, user, mail, crewdata, sendMail, sendMailTech) {
	var d = q.defer();
	var _this = this;
	var SetupTearDown = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	var emails = [];

	_this.crud.find({ _id: id })
		.then(function (orderS) {
			SetupTearDown = orderS.data[0];
			return _this.user.getAdminUsers();
		})
		.then(function (users) {
			if (sendMail == true) {
				emails = [SetupTearDown.client.account.email];
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
			return mail.sendSetupTearDown(SetupTearDown, emails, _this.dirname);
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

SetupTearDown.prototype.sendSetupTearDownUpdate = function (id, user, mail, crewdata, sendMail, sendMailTech) {
	var d = q.defer();
	var _this = this;
	var SetupTearDown = {};
	var emails = [];

	_this.crud.find({ _id: id })
		.then(function (orderS) {
			SetupTearDown = orderS.data[0];
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
			// 	console.log("SERVICE ORDER UPDATE!!!", emails, SetupTearDown)
			return mail.sendSetupTearDownUpdate(SetupTearDown, emails, user);
			//}
			//else{
			//	return q.when();
			//}
		})
		.then(function (data) {
			SetupTearDown.fieldsChanged = [];
			SetupTearDown.addedItems = [];
			SetupTearDown.removedItems = [];
			return _this.crud.update({ _id: SetupTearDown._id }, SetupTearDown);
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

SetupTearDown.prototype.sendSetupTearDownDelete = function (id, user, mail, SetupTearDown) {
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
			return mail.sendSetupTearDownDelete(SetupTearDown, emails, user);
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

SetupTearDown.prototype.createSetupTearDown = function (id, user) {
	var d = q.defer();
	var _this = this;
	var query = {
		_id: id
	};
	_this.crud.find(query)
		.then(function (result) {
			return pdf.createSetupTearDown(result.data[0]);
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

SetupTearDown.prototype.getSetupTearDown = function (id, res, user) {
	this.createSetupTearDown(id, user)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType("application/pdf");
				res.send(data);
			});
		});
};

SetupTearDown.prototype.createReport = function (query, queryDescription) {
	var d = q.defer();
	var _this = this;
	_this.crud.find(query)
		.then(function (result) {
			return excel.createReport(result.data, 'SetupTearDown', query, queryDescription);
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

SetupTearDown.prototype.getReport = function (query, queryDescription, res) {
	this.createReport(query, queryDescription)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
				res.send(data);
			});
		});
};

SetupTearDown.prototype.changeStatus = function (id) {
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


module.exports = SetupTearDown;
