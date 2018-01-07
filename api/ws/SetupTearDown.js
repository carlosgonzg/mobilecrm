'use strict';

var SetupTearDown = require('../dto/SetupTearDown');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.put(prefix, function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		SetUp.update(req.body.query, req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		SetUp.insert(req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/download', function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		SetUp.getSetupTearDown(req.body.id, res, req.user)
	});

	app.post(prefix + '/report', function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		SetUp.getReport(req.body.query, req.body.queryDescription, res);
	});

	app.post(prefix + '/send', function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		SetUp.sendSetupTearDown(req.body.id, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/Delete', function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		SetUp.sendSetupTearDownDelete(req.body.id, req.user, mail, req.body.SetupTearDown)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/filter', function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		var sort = null;
		if(req.body.sort){
			sort = {};
			sort[req.body.sort.field] = req.body.sort.order;
		}
		SetUp.crud.find(req.body.query, sort)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/status', function (req, res) {
		var SetUp = new SetupTearDown(app.db, req.user, dirname);
		SetUp.changeStatus(req.body.id, req.user)
		.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, SetupTearDown);
}
