'use strict';

var OrderService = require('../dto/orderService');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.put(prefix, function (req, res) {
		var orderService = new OrderService(app.db, req.user);
		orderService.update(req.body.query, req.body.obj, req.user.entity.fullName || req.user.entity.name, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var orderService = new OrderService(app.db, req.user, dirname);
		orderService.insert(req.body.obj, req.user.entity.fullName || req.user.entity.name, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/invoice', function (req, res) {
		var orderService = new OrderService(app.db, req.user);
		orderService.getInvoice(req.body.id, res, req.user.entity.fullName || req.user.entity.name)
	});

	app.post(prefix + '/send', function (req, res) {
		var orderService = new OrderService(app.db, req.user, dirname);
		orderService.sendInvoice(req.body.id, req.user.entity.fullName || req.user.entity.name, mail)
		.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, OrderService);
}
