'use strict';

var Crud = require('./crud');

function City(db, userLogged) {
	this.crud = new Crud(db, 'City', userLogged, true);

	//DB Table Schema
	this.schema = {
		id : '/City',
		type : 'object',
		properties : {
			stateId: {
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
	this.crud.uniqueFields = [ ['stateId', 'description'] ];
}

//Export
module.exports = City;
