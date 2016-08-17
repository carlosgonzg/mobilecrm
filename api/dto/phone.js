'use strict';

function Phone() {
	this.schema = {
		id : '/Phone',
		type : 'object',
		properties : {
			number : {
				type : 'string',
				required : true
			},
			phoneType : {
				type : 'object',
				required : true
			}
		}
	};
}

//Export
module.exports = Phone;
