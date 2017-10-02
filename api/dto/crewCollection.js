'use strict';

function crewCollection() {
	this.schema = {
		id: '/crewCollection',
		type: 'object',
		properties: {
			item: {
				type: 'string',
				required: false
			},
			price: {
				type: 'int',
				required: false
			}
		}
	};
}

//Export
module.exports = crewCollection;
