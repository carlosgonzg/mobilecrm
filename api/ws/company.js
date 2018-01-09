'use strict';

var Company = require('../dto/company');
var util = require('../dto/util');

module.exports = function (prefix, app) {
	app.get(prefix + '/sequence/peek/:id', function (req, res) {
		var company = new Company(app.db, req.user);
		var id = req.params.id.split('&')[0]
		var dor
		if (req.params.id.split('&')[1] != 'undefined') {
			dor = req.params.id.split('&')[1]
		}
		company.getSequence(id, true, dor).then(util.success(res), util.error(res));
	});
	app.get(prefix + '/sequence/estimate/:id', function (req, res) {
		var company = new Company(app.db, req.user);
		var id = req.params.id

		company.getSequenceQuote(id, true).then(util.success(res), util.error(res));
	});
	app.get(prefix + '/sequence/setupTearDown/:id', function (req, res) {
		var company = new Company(app.db, req.user);
		var id = req.params.id

		company.getSequenceSetup(id, true).then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, Company);
}
