'use strict';

var Crud = require('./crud');

function RoleOptions(db, userLogged) {
	this.crud = new Crud(db, 'ROLEOPTIONS', userLogged, true);

	//DB Table Schema
	this.schema = {
		id : '/RoleOptions',
		type : 'object',
		properties : {
			roleId : {
				type : 'int',
				required : true
			},
			optionId : {
				type : 'int',
				required : true
			},
			read : {
				type : 'boolean',
				required : false
			},
			write : {
				type : 'boolean',
				required : false
			},
			update : {
				type : 'boolean',
				required : false
			},
			delete : {
				type : 'boolean',
				required : false
			},
			sort : {
				type : 'int',
				required : true
			}
		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = [ ['roleId', 'optionId'] ];
}

//Export
module.exports = RoleOptions;
