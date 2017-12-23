'use strict';

var ServiceQuotes = require('../dto/serviceQuotes');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.put(prefix, function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		serviceQuotes.update(req.body.query, req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		serviceQuotes.insert(req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/download', function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		serviceQuotes.getServiceQuotes(req.body.id, res, req.user)
	});

	app.post(prefix + '/report', function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		serviceQuotes.getReport(req.body.query, req.body.queryDescription, res);
	});

	app.post(prefix + '/send', function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		serviceQuotes.sendServiceQuotes(req.body.id, req.user, mail, req.body.emails || [], req.body.sendToAllAdmin)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/sendDelete', function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		serviceQuotes.sendServiceQuotesDelete(req.body.id, req.user, mail, req.body.serviceQuotes)
		.then(util.success(res), util.error(res));
	});


	app.post(prefix + '/filter', function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		var sort = null;
		if(req.body.sort){
			sort = {};
			sort[req.body.sort.field] = req.body.sort.order;
		}
		serviceQuotes.crud.find(req.body.query, sort)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/status', function (req, res) {
		var serviceQuotes = new ServiceQuotes(app.db, req.user, dirname);
		serviceQuotes.changeStatus(req.body.id, req.user)
		.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, ServiceQuotes);
}
