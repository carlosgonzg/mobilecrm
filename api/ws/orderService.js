'use strict';

var OrderService = require('../dto/orderService');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, OrderService);
}
