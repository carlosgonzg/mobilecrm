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

	app.post(prefix + '/report', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.getReport(req.body.query, req.body.queryDescription, res);
	});

	app.post(prefix + '/send', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.sendInvoice(req.body.id, req.user, mail, req.body.emails || [], req.body.sendToAllAdmin)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/sendDelete', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.sendInvoiceDelete(req.body.id, req.user, mail, req.body.emails || [], req.body.invoice)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/monthlyStatement', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.getMonthlyStatement(req.body.query, req.user)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/invoicesByCompany', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		console.log(req.body.query)
		invoice.getInvoicesByCompany(req.body.query, req.user)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/invoicesByServiceType', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		console.log(req.body.query)
		invoice.getInvoicesByServiceType(req.body.query, req.user)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/totalPendingToPay', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		console.log(req.body.query)
		invoice.getTotalPendingToPay(req.body.query, req.user)
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

	app.get(prefix + '/expenses', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.getExpenses()
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/getExpensesByFilter', function (req, res) {
		var invoice = new Invoice(app.db, req.user, dirname);
		invoice.getExpensesByFilter(req.body.query, req.body.start, req.body.end)
		.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, Invoice);
}
