'use strict';

var Crud = require('./crud');
var User = require('./user');

function Company(db, userLogged) {
	this.user = new User(db, '', userLogged);
	this.crud = new Crud(db, 'COMPANY', userLogged);

	//DB Table Schema
	this.schema = {
		id : '/Company',
		type : 'object',
		properties : {
			
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = [ 'entity.name' ];
}

//Export
module.exports = Company;
