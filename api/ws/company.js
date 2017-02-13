'use strict';

var Company = require('../dto/company');
var util = require('../dto/util');

module.exports = function (prefix, app) {
	app.get(prefix + '/sequence/peek/:id', function (req, res) {
		var company = new Company(app.db, req.user);
		company.getSequence(req.params.id, true)
		.then(util.success(res), util.error(res));
	});

	require('./crud')(prefix, app, Company);
}
