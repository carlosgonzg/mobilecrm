'use strict';

var Option = require('../dto/option');
var util = require('../dto/util');

module.exports = function (prefix, app) {

	//Update
	app.put(prefix, function (req, res) {
		var option = new Option(app.db, req.user);
		option.update(req.body.query, req.body.obj).then(util.success(res), util.error(res));
	});
	require('./crud')(prefix, app, Option);
}
