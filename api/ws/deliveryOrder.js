'use strict';

var DeliveryOrder = require('../dto/deliveryOrder');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.put(prefix, function (req, res) {
		var deliveryOrder = new DeliveryOrder(app.db, req.user, dirname);
		deliveryOrder.update(req.body.query, req.body.obj, req.user, mail)
			.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var deliveryOrder = new DeliveryOrder(app.db, req.user, dirname);
		deliveryOrder.insert(req.body.obj, req.user, mail)
			.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/download', function (req, res) {
		var deliveryOrder = new DeliveryOrder(app.db, req.user, dirname);
		deliveryOrder.getServiceOrder(req.body.id, res, req.user)
	});

	app.post(prefix + '/report', function (req, res) {
		var deliveryOrder = new DeliveryOrder(app.db, req.user, dirname);
		deliveryOrder.getReport(req.body.query, req.body.queryDescription, res);
	});

	app.post(prefix + '/send', function (req, res) {
		var deliveryOrder = new DeliveryOrder(app.db, req.user, dirname);
		deliveryOrder.sendServiceOrder(req.body.id, req.user, mail)
			.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/filter', function (req, res) {
		var deliveryOrder = new DeliveryOrder(app.db, req.user, dirname);
		var sort = null;
		if (req.body.sort) {
			sort = {};
			sort[req.body.sort.field] = req.body.sort.order;
		}
		deliveryOrder.crud.find(req.body.query, sort)
			.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/status', function (req, res) {
		var deliveryOrder = new DeliveryOrder(app.db, req.user, dirname);
		deliveryOrder.changeStatus(req.body.id, req.user)
			.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, DeliveryOrder);
}
