'use strict';

var HomeBusiness = require('../dto/homeBusiness');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.put(prefix, function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		homeBusiness.update(req.body.query, req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix, function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		homeBusiness.insert(req.body.obj, req.user, mail)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/download', function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		homeBusiness.gethomeBusiness(req.body.id, res, req.user)
	});

	app.post(prefix + '/report', function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		homeBusiness.getReport(req.body.query, req.body.queryDescription, res);
	});

	app.post(prefix + '/send', function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		homeBusiness.sendhomeBusiness(req.body.id, req.user, mail)
		.then(util.success(res), util.error(res));
	});
console.log(prefix)
	app.post(prefix + '/sendDelete', function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		 homeBusiness.sendhomeBusinessDelete(req.body.id, req.user, mail, req.body.homeBusiness)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/filter', function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		var sort = null;
		if(req.body.sort){
			sort = {};
			sort[req.body.sort.field] = req.body.sort.order;
		}
		homeBusiness.crud.find(req.body.query, sort)
		.then(util.success(res), util.error(res));
	});

	app.post(prefix + '/status', function (req, res) {
		var homeBusiness = new HomeBusiness(app.db, req.user, dirname);
		homeBusiness.changeStatus(req.body.id, req.user)
		.then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, HomeBusiness);
}
