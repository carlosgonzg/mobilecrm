'use strict';

var q = require('q');
var bcrypt = require('bcryptjs');
var mail = require('../mail');
var Crud = require('./crud');
var util = require('./util');
var Role = require('./role');
var Option = require('./option');
var RoleOptions = require('./roleOptions');
var Address = require('./address');
var Phone = require('./phone');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var md5 = require('md5')
var crewCollection = require("./crewCollection")

function User(db, secret, userLogged) {
	this.crud = new Crud(db, 'USER', userLogged );
	this.crudSO = new Crud(db, 'SERVICEORDER', userLogged );
	this.crudWO = new Crud(db, 'WORKORDER', userLogged );
	this.crudInv = new Crud(db, 'INVOICE', userLogged );
	this.secret = secret;
	this.db = db;
	//DB Table Schema
	var accountSchema = {
		type : 'object',
		properties : {
			email : {
				type : 'string',
				required : true
			},
			password : {
				type : 'string',
				required : true
			}
		}
	};
	var entitySchema = {
		type : 'object',
		properties : {
			firstName : {
				type : 'string',
				required : true
			},
			lastName : {
				type : 'string',
				required : true
			},
			fullName : {
				type : 'string',
				required : true
			},
			url : {
				type : 'string',
				required : false
			}
		}
	};

	this.schema = {
		id : '/User',
		type : 'object',
		properties : {
			_id : {
				type : 'int',
				required : false
			},
			account : {
				type : 'object',
				required : true //,
				//properties : accountSchema
			},
			entity : {
				type : 'object',
				required : true //,
				//properties : entitySchema
			},
			profilePicture : {
				type : 'string',
				required : false
			},
			role : {
				type : 'object',
				required : true //,
				//properties : new Role().schema
			},
			status : {
				type : 'object',
				required : true
			},
			CrewCollection: {
				type: 'array',
				required: false,
				items: new crewCollection().schema
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = ['account.email'];
	this.role = new Role(db);
	this.option = new Option(db);
	this.roleOptions = new RoleOptions(db);
}
User.prototype.encryptPassword = function (password) {
	var salt = bcrypt.genSaltSync(10);
	return bcrypt.hashSync(password + this.secret, salt);
};

//Change password Function
User.prototype.changePassword = function (email, newPassword) {
	var d = q.defer();
	var _this = this;
	var query = {
		'account.email' : email
	};
	this.crud.find(query)
	.then(function (obj) {
		var user = obj.data[0];
		if (user && user.status._id == 1) {
			user.account.password = _this.encryptPassword(newPassword);
			return _this.crud.update(query, user)
		} else {
			throw new Error('Couldn\'t find user');
		}
	})
	.then(function (obj) {
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

//Forget password Function
User.prototype.forgetPassword = function (email, urlServer) {
	var d = q.defer();
	var changed = false;
	var _this = this;
	var query = {
		'account.email' : email
	};
	this.crud.find(query)
	.then(function (obj) {
		var user = obj.data[0];
		if (user && user.status._id) {
			user.confirmToken = md5(new Date() + email);
			mail.sendForgotPasswordMail(email, user.confirmToken, urlServer);
			return _this.crud.update(query, user);
		} else {
			throw 'Couldn\'t find user';
		}
	})
	.then(function (obj) {
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

User.prototype.register = function (user) {
	var d = q.defer();
	var _this = this;
	var query = {
		'account.email' : user.account.email
	};
	var unhashedPassword = user.account.password;
	user.account.password = _this.encryptPassword(user.account.password);

	user.status = {
		_id : 2,
		description : 'deactivated'
	};
	this.crud.insert(user)
	.then(function (obj) {
		obj = obj.data;
		obj.account.confirmToken = mail.sendConfirmateMail(obj.account.email, unhashedPassword);
		return _this.crud.update({
			_id : obj._id
		}, user);
	})
	.then(function (obj) {
		console.log(_this.db)
		if (user.role._id === 4) {
			util.getSequence(_this.db, 'TECH')
			.then(function (result) {
				return util.getSequence(_this.db, _this.table);
			})
		} else {
			d.resolve(obj);
		}

	})
	.then(function (obj) {
		d.resolve({
			result : 'Inserted',
			data : obj
		});
	})
	.catch (function (err) {
		d.reject(err);
	})
		return d.promise;
};

User.prototype.confirm = function (token) {
	var d = q.defer();
	var _this = this;
	var query = {
		'account.confirmToken' : token
	};
	if (token) {
		if (token.length >= 15 && token.length <= 200) {
			_this.crud.find(query)
			.then(function (obj) {
				if (obj.data.length < 0) {
					throw 'Invalid token';
				}
				var user = obj.data[0];
				user.status = {
					_id : 1,
					description : 'active'
				};
				user.account.confirmToken = null;
				return _this.crud.update(query, user);
			})
			.then(function (obj) {
				d.resolve(obj);
			})
			.catch (function (err) {
				d.reject(err);
			});
		} else {
			d.reject('Invalid token');
		}
	} else {
		d.reject('Token is empty');
	}
	return d.promise;
};
User.prototype.getMiniUser = function (user) {
	var miniUser = {
		_id : user._id,
		role : {
			_id: user.role._id
		},
		entity : {
			fullName : user.entity.fullName
		}
	};
	return miniUser;
};
User.prototype.login = function (email, password) {
	var d = q.defer();
	var _this = this;
	if (!email || !password) {
		d.reject({
			result : 'Not ok',
			errors : 'email and/or password are empty'
		});
	} else {
		var query = {
			'account.email' : email
		};
		this.crud.find(query)
		.then(function (obj) {
			if (obj.data.length < 0) {
				throw 'The user doesn\'t exists';
			}
			var user = obj.data[0];
			if (!bcrypt.compareSync(password + _this.secret, user.account.password)) {
				throw 'User and password doesn\'t match';
			}
			if (user.status._id == 2) {
				throw 'User is not active';
			}
			return user;
		})
		.then(function (obj) {
			console.log('1')
			var token = jwt.sign(_this.getMiniUser(obj), _this.secret, {
					expiresInMinutes : 60 * 3
				});
			d.resolve({
				data : obj,
				token : token
			});
		})
		.catch (function (err) {
			d.reject({
				result : 'not ok',
				errors : err
			});
		});
	}
	return d.promise;
};
User.prototype.getRoleOptions = function(user){
	var d = q.defer();
	var _this = this;
	var queryRole = {
		_id: user.role
	};
	_this.roleOptions.crud.find(queryRole)
	.then(function(obj){
		var options = _.map(obj.data, function(obj){
			return obj.optionId;
		});
		var queryOption = {
			_id: {
				$in: options
			}
		};
		return _this.option.crud.find(queryOption, [['sort', 'asc']]);
	})
	.then(function (obj) {
			d.resolve({
				result: 'ok',
				data : obj
			});
		})
	.catch (function (err) {
			d.reject({
				result : 'not ok',
				errors : err
			});
		});
	return d.promise;
};
User.prototype.getActual = function(){
	var d = q.defer();
	var _this = this;
	var query = {
		_id: _this.crud.userLogged._id
	};
	_this.crud.find(query)
	.then(function (obj) {
			d.resolve({
				result: 'ok',
				data : obj.data[0]
			});
		})
	.catch (function (err) {
			d.reject({
				result : 'not ok',
				errors : err
			});
		});
	return d.promise;
};
User.prototype.getAdminUsers = function(getPono){
	var d = q.defer();
	var query = {
		$and:[
			{
				'role._id': 1
			},
			{
				$or: [{
					sendEmail: true
				}]
			}
		]
	};
	if(getPono){
		query.$and[1].$or.push({ sendEmailWhenPono: true });
	}
	this.crud.find(query)
	.then(function (obj) {
		d.resolve({
			result: 'ok',
			data : obj.data
		});
	})
	.catch (function (err) {
		d.reject({
			result : 'not ok',
			errors : err
		});
	});
	return d.promise;
};

User.prototype.update = function(query, user, userLogged){
	var d = q.defer();
	var _this = this;
	var obj = {};
	_this.crud.update(query, user)
	.then(function(result){
		return _this.crud.find({ '_id': user._id });
	})
	.then(function(result){
		obj = result.data[0];
		return _this.crudSO.update({ 'client._id': obj._id }, { client: obj });
	})
	.then(function(result){
		return _this.crudWO.update({ 'client._id': obj._id }, { client: obj });
	})
	.then(function(result){
		return _this.crudInv.update({ 'client._id': obj._id }, { client: obj });
	})
	.then(function(result){
		d.resolve(obj);
	})
	.catch(function(err){
		console.log(err)
		d.reject(err);
	});
	return d.promise;
};

module.exports = User;
