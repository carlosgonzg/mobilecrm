'use strict';

var Crud = require('./crud');

function Item(db, userLogged) {
	this.crud = new Crud(db, 'ITEM', userLogged);

	//DB Table Schema
	this.schema = {
		id : '/Item',
		type : 'object',
		properties : {
			code : {
				type : 'int',
				required : false
			},
			description : {
				type : 'string',
				required : true
			},
			price: {
				type: 'int',
				required: true
			},
			part : {
				type : 'int',
				required : false
			},
			unitOfMeasure: {
				type: 'string',
				required: false
			}
		}
	};
	this.crud.schema = this.schema;
	//this.crud.uniqueFields = [ 'code' ];
}

//Export
module.exports = Item;
