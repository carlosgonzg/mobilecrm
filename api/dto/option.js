'use strict';

var Crud = require('./crud');
var q = require('q');

function Option(db, userLogged) {
	this.crud = new Crud(db, 'OPTION', userLogged);
	this.crudRoleOptions = new Crud(db, 'ROLEOPTIONS', userLogged);

	//DB Table Schema
	this.schema = {
		id : '/Option',
		type : 'object',
		properties : {
			description : {
				type : 'string',
				required : true
			},
			url : {
				type : 'string',
				required : true
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = [ 'url' ];
}

Option.prototype.update = function(query, data){
	var _this = this;
	var d = q.defer();
	_this.crud.update(query, data)
	.then(function(res){
		var queryRO = {
			'option._id': data._id
		};
		var dataRO = { 
			option: data 
		};
		return _this.crudRoleOptions.update(queryRO, dataRO);
	})
	.then(function(res){
		d.resolve(data);
	})
	.fail(function(error){
		d.reject(error);
	});
	return d.promise;
}
//Export
module.exports = Option;
