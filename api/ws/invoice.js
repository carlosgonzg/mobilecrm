'use strict';

var Invoice = require('../dto/invoice');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.put(prefix, function (req, res) {
		var invoice = new Invoice(app.db, req.user);
		invoice.update(req.body.query, req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.insert(req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/download', function (req, res) {
		var invoice = new Invoice(app.db, req.user);
		invoice.getInvoice(req.body.id, res, req.user)
	});

	app.post(prefix + '/send', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.sendInvoice(req.body.id, req.user, mail, req.body.emails || [], req.body.sendToAllAdmin)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/monthlyStatement', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.getMonthlyStatement(req.body.query, req.user)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/monthlyStatement/export', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.getMonthlyStatementFile(req.body.query, req.body.format, req.user, res);
	});

	app.post(prefix + '/status', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.changeStatus(req.body.id, req.user)
		.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, Invoice);
}
