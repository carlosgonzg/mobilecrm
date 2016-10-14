'use strict';

var Crud = require('./crud');
var Address = require('./address');
var Phone = require('./phone');

function Company(db, userLogged) {
	this.crud = new Crud(db, 'COMPANY', userLogged);

	//DB Table Schema
	this.schema = {
		id : '/Company',
		type : 'object',
		properties : {
			addresses : {
				type : 'array',
				required : true,
				items : new Address().schema
			},
			phones : {
				type : 'array',
				required : true,
				items : new Phone().schema
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = [ 'entity.name' ];
}

//Export
module.exports = Company;
