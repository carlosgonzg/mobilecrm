'use strict';

function Address() {
	this.schema = {
		id : '/Address',
		type : 'object',
		properties : {
			address1 : {
				type : 'string',
				required : true
			},
			address2 : {
				type : 'string',
				required : false
			},
			city : {
				type : 'object',
				required : true
			},
			state : {
				type : 'object',
				required : true
			},
			country : {
				type : 'object',
				required : true
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
