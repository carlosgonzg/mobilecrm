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

function homeBusiness(db, userLogged, dirname) {
	this.crud = new Crud(db, 'HOMEBUSINESS', userLogged);
	this.crudInvoice = new Crud(db, 'INVOICE', userLogged);
	this.user = new User(db, '', userLogged);
	this.crew = new Crud(db, 'USER', userLogged);

	this.dirname = dirname;
	//DB Table Schema
	this.schema = {
		id: '/homeBusiness',
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
			hor: {
				type: 'string',
				required: true
			},
			pono: {
				type: 'string',
				required: true
			},
			acserial: {
				type: 'string',
				required: false
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
	this.crud.uniqueFields = ['hor'];
}

homeBusiness.prototype.savePhotos = function (homeBusiness) {
	var d = q.defer();
	var dirname = this.dirname + '/public/app/images/uploads';
	var homeBusinessDir = dirname + '/' + homeBusiness._id;
	if (homeBusiness.photos && homeBusiness.photos.length > 0) {
		var urlPhotos = [];
		for (var i = 0; i < homeBusiness.photos.length; i++) {
			var photo = homeBusiness.photos[i];
			//chequeo que existe la carpeta del Home & Business, si no la creo
			if (!fs.existsSync(homeBusinessDir)) {
				fs.mkdirSync(homeBusinessDir);
			}
			//chequeo que existe la foto, si no la creo y cambio el url de la foto por el relative path
			var fileDir = homeBusinessDir + '/' + photo.name;
			if (!fs.existsSync(fileDir)) {
				var data = photo.url.replace(new RegExp('data:' + photo.type + ';base64,'), '');
				urlPhotos.push({
					id: i,
					url: '/images/uploads/' + homeBusiness._id + '/' + photo.name
				})
				fs.writeFileSync(fileDir, data, 'base64');
			}
		}
		for (var i = 0; i < urlPhotos.length; i++) {
			for (var j = 0; j < homeBusiness.photos.length; j++) {
				if (urlPhotos[i].id == j) {
					homeBusiness.photos[j].url = urlPhotos[i].url.toString();
					break;
				}
			}
		}
		d.resolve(homeBusiness.photos);
	}
	else {
		d.resolve([]);
	}
	return d.promise;
};

homeBusiness.prototype.insert = function (homeBusiness, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];
	var sendMail = homeBusiness.sendMail || false;
	var sendMailTech = homeBusiness.sendTotech || false;


	if (sendMailTech == true) {
		/*
		busco los email de los crew leader - fz
			for (var row = 0; row < homeBusiness.items.length; row++) {
					if (homeBusiness.items[row].crewLeaderCol != undefined) {
						var element = homeBusiness.items[row].crewLeaderCol.id
						userIds.push(element);
					}
				} */

		//busco los id de los los tech en el cuerpo de la orden
		for (var n = 0; n < homeBusiness.crewHeader.length; n++) {
			if (homeBusiness.crewHeader != undefined) {
				var element = homeBusiness.crewHeader[n].id
				userIds.push(element);
			}
		}
		this.crew.find({ _id: { $in: userIds } })
			.then(function (data) {
				crewdata = data
			})
	}

	//sumo el total
	for (var i = 0; i < homeBusiness.items.length; i++) {
		total += homeBusiness.items[i].quantity * homeBusiness.items[i].price;
	}
	homeBusiness.total = total;
	var photos = homeBusiness.photos;
	//Consigo el sequencial de invoice
	var promise = homeBusiness.invoiceNumber ? q.when(homeBusiness.invoiceNumber) : q.when('Pending Invoice');
	promise
		.then(function (sequence) {
			homeBusiness.invoiceNumber = sequence;
			delete homeBusiness.sendMail;
			delete homeBusiness.photos;
			//inserto
			return _this.crud.insert(homeBusiness);
		})
		//Guardando las fotos
		.then(function (obj) {
			homeBusiness._id = obj.data._id;
			homeBusiness.photos = photos;
			return _this.savePhotos(homeBusiness);
		})
		//actualizo y mando correo
		.then(function (photos) {
			return _this.crud.update({ _id: homeBusiness._id }, homeBusiness)
		})
		.then(function (photos) {
			if (sendMail || sendMailTech) {  
				_this.sendhomeBusiness(homeBusiness._id, user, mail, crewdata, sendMail, sendMailTech);
}
			d.resolve(homeBusiness);
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

homeBusiness.prototype.update = function (query, homeBusiness, user, mail) {
	var d = q.defer();
	var _this = this;
	var total = 0;
	var crewdata;
	var userIds = [];
	var sendMail = homeBusiness.sendMail || false;
	var sendMailTech = homeBusiness.sendTotech || false;

	if (homeBusiness.serviceType && homeBusiness.serviceType._id == 4 && homeBusiness.quotes == 1 && (homeBusiness.fromQuotes || 0) == 0) {
		_this.insert(homeBusiness, user, mail)
		return d.promise;
	}

	if (sendMailTech == true) {
		/*
		//busco los email de los crew leader - fz
		for (var row = 0; row < homeBusiness.items.length; row++) {
					if (homeBusiness.items[row].crewLeaderCol != undefined) {
						var element = homeBusiness.items[row].crewLeaderCol.id
						userIds.push(element);
					}
				} */

		//busco los id de los los tech en el cuerpo de la orden
		for (var n = 0; n < homeBusiness.crewHeader.length; n++) {
			if (homeBusiness.crewHeader != undefined) {
				var element = homeBusiness.crewHeader[n].id
				userIds.push(element);
			}
		}
		this.crew.find({ _id: { $in: userIds } })
			.then(function (data) {
				crewdata = data
			})
	}

	//sumo el total
	for (var i = 0; i < homeBusiness.items.length; i++) {
		total += homeBusiness.items[i].quantity * homeBusiness.items[i].price;
	}

	homeBusiness.total = total;
	_this.savePhotos(homeBusiness)
		.then(function (photos) {
			homeBusiness.photos = photos;
			delete homeBusiness.sendMail;

			var setObj = {};
			if ([5, 7].indexOf(homeBusiness.status._id) != -1) {
				setObj = { invoiceNumber: "No Invoice" };
			}
			else {
				setObj = { invoiceNumber: homeBusiness.invoiceNumber };
			}

			if (homeBusiness.pono)
				setObj.pono = homeBusiness.pono;
			if (homeBusiness.unitno)
				setObj.unitno = homeBusiness.unitno;
			if (homeBusiness.items.length > 0)
				setObj.items = homeBusiness.items;
			if (homeBusiness.total)
				setObj.total = homeBusiness.total;

			_this.crudInvoice.update({ hor: homeBusiness.hor }, setObj, true);

			return _this.crud.update(query, homeBusiness);
		})
		.then(function (obj) {
			if (sendMail || sendMailTech)
				_this.sendhomeBusinessUpdate(query._id, user, mail, crewdata, sendMail, sendMailTech);
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

homeBusiness.prototype.sendhomeBusiness = function (id, user, mail, crewdata, sendMail, sendMailTech) {
	var d = q.defer();
	var _this = this;
	var homeBusiness = {};
	var url = '';
	var urlPdf = '';
	var fileName = '';
	var fileNamePdf = '';
	var emails = [];

	_this.crud.find({ _id: id })
		.then(function (orderS) {
			homeBusiness = orderS.data[0];
			return _this.user.getAdminUsers();
		})
		.then(function (users) {
			if (sendMail == true) {
				emails = [homeBusiness.client.account.email];
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
			return mail.sendhomeBusiness(homeBusiness, emails, _this.dirname);
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

homeBusiness.prototype.sendhomeBusinessUpdate = function (id, user, mail, crewdata, sendMail, sendMailTech) {
	var d = q.defer();
	var _this = this;
	var homeBusiness = {};
	var emails = [];

	_this.crud.find({ _id: id })
		.then(function (orderS) {
			homeBusiness = orderS.data[0];
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
			// 	console.log("Home & Business UPDATE!!!", emails, homeBusiness)
			return mail.sendhomeBusinessUpdate(homeBusiness, emails, user);
			//}
			//else{
			//	return q.when();
			//}
		})
		.then(function (data) {
			homeBusiness.fieldsChanged = [];
			homeBusiness.addedItems = [];
			homeBusiness.removedItems = [];
			return _this.crud.update({_id: homeBusiness._id}, homeBusiness);
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

homeBusiness.prototype.sendhomeBusinessDelete = function (id, user, mail, homeBusiness) {
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
			return mail.sendhomeBusinessDelete(homeBusiness, emails, user);
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

homeBusiness.prototype.createhomeBusiness = function (id, user) {
	var d = q.defer();
	var _this = this;
	var query = {
		_id: id
	};
	_this.crud.find(query)
		.then(function (result) {
			return pdf.createhomeBusiness(result.data[0]);
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

homeBusiness.prototype.gethomeBusiness = function (id, res, user) {
	this.createhomeBusiness(id, user)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType("application/pdf");
				res.send(data);
			});
		});
};

homeBusiness.prototype.createReport = function (query, queryDescription) {
	var d = q.defer();
	var _this = this;
	_this.crud.find(query)
		.then(function (result) {
			return excel.createReport(result.data, 'homeBusiness', query, queryDescription);
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

homeBusiness.prototype.getReport = function (query, queryDescription, res) {
	this.createReport(query, queryDescription)
		.then(function (obj) {
			fs.readFile(obj.path, function (err, data) {
				res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
				res.send(data);
			});
		});
};

homeBusiness.prototype.changeStatus = function (id) {
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
			//return _this.crud.update({ _id: Number(id) }, obj);
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


module.exports = homeBusiness;
