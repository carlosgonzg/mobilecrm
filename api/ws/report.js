'use strict';

var Report = require('../dto/report');
var util = require('../dto/util');

module.exports = function (prefix, app, mail, dirname) {
	app.post(prefix + '/report', function (req, res) {
		var report = new Report(app.db, req.user, dirname);
		report.getReport(req.body.id, res, req.user)
	});
}
