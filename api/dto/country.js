'use strict';

var Crud = require('./crud');

function Country(db, userLogged) {
	this.crud = new Crud(db, 'COUNTRY', userLogged);

	//DB Table Schema
	this.schema = {
		id : '/Country',
		type : 'object',
		properties : {
			description : {
				type : 'string',
				required : true
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = [ 'description' ];
}

//Export
module.exports = Country;
