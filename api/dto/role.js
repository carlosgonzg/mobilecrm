'use strict';

var Crud = require('./crud');

function Role(db, userLogged) {
	this.crud = new Crud(db, 'ROLE', userLogged, true);

	//DB Table Schema
	this.schema = {
		id : '/Role',
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
module.exports = Role;
