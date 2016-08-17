'use strict';

var Crud = require('./crud');

function State(db, userLogged) {
	this.crud = new Crud(db, 'STATE', userLogged, true);

	//DB Table Schema
	this.schema = {
		id : '/State',
		type : 'object',
		properties : {
			countryId: {
				type: 'int',
				required: true
			},
			description : {
				type : 'string',
				required : true
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = [ ['countryId', 'description'] ];
}

//Export
module.exports = State;
