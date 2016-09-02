'use strict';

var OrderService = require('../dto/orderService');
var util = require('../dto/util');

module.exports = function (prefix, app) {
	app.put(prefix + '/:id', function (req, res) {
		var orderService = new OrderService(app.db, req.user);
		orderService.update(req.body.query, req.body.obj)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var orderService = new OrderService(app.db, req.user);
		orderService.insert(req.body.obj)
		.then(util.success(res), util.error(res));
	});

	require('./crud')(prefix, app, OrderService);
}
