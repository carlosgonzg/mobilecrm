'use strict';

var Crud = require('./crud');

function ItemCollection(db, userLogged) {
	this.crud = new Crud(db, 'ITEMCOLLECTION', userLogged);

	//DB Table Schema
	this.schema = {
		id : '/Item',
		type : 'object',
		properties : {
			description : {
				type : 'string',
				required : true
			},
			items: {
				type: 'array',
				required: true
			}
		}
	};
	this.crud.schema = this.schema;
}
//Export
module.exports = ItemCollection;
