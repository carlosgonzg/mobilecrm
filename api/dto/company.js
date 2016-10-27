'use strict';

var Crud = require('./crud');

function Company(db, userLogged) {
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
