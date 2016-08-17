'use strict';

var OrderService = require('../dto/orderservice');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, OrderService);
}
