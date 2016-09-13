'use strict';

var WorkOrder = require('../dto/workOrder');
var util = require('../dto/util');

module.exports = function (prefix, app) {
	app.put(prefix + '/:id', function (req, res) {
		var workOrder = new WorkOrder(app.db, req.user);
		workOrder.update(req.body.query, req.body.obj)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var workOrder = new WorkOrder(app.db, req.user);
		workOrder.insert(req.body.obj)
		.then(util.success(res), util.error(res));
	});

	require('./crud')(prefix, app, WorkOrder);
}
