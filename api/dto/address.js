'use strict';

function Address(required) {
	if(required == undefined){
		required = true
	}
	this.schema = {
		id : '/Address',
		type : 'object',
		properties : {
			address1 : {
				type : 'string',
				required : required
			},
			address2 : {
				type : 'string',
				required : false
			},
			city : {
				type : 'object',
				required : required
			},
			state : {
				type : 'object',
				required : required
			},
			country : {
				type : 'object',
				required : required
			},
			zipcode : {
				type : 'string',
				required : false
			},
			latitude : {
				type : 'int',
				required : false
			},
			longitude : {
				type : 'int',
				required : false
			}
		}
	};
}

//Export
module.exports = Address;
