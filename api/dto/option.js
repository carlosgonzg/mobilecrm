'use strict';

var Crud = require('./crud');

function Option(db, userLogged) {
	this.crud = new Crud(db, 'OPTION', userLogged);

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

//Export
module.exports = Option;
