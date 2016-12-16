'use strict';

var WorkOrder = require('../dto/workOrder');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.put(prefix, function (req, res) {
		var workOrder = new WorkOrder(app.db, req.user, dirname);
		workOrder.update(req.body.query, req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var workOrder = new WorkOrder(app.db, req.user, dirname);
		workOrder.insert(req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/download', function (req, res) {
		var workOrder = new WorkOrder(app.db, req.user, dirname);
		workOrder.getWorkOrder(req.body.id, res, req.user)
	});

	app.post(prefix + '/send', function (req, res) {
		var workOrder = new WorkOrder(app.db, req.user, dirname);
		workOrder.sendWorkOrder(req.body.id,req.body.emails, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/filter', function (req, res) {
		var workOrder = new WorkOrder(app.db, req.user, dirname);
		var sort = null;
		if(req.body.sort){
			sort = {};
			sort[req.body.sort.field] = req.body.sort.order;
		}
		workOrder.crud.find(req.body.query, sort)
		.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, WorkOrder);
}
