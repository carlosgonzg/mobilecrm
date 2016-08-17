var List = require('../dto/list');
var util = require('../dto/util');

module.exports = function (prefix, app) {
	app.get(prefix + '/:id', function (req, res) {
		var list = new List();
		list.getList(req.params.id)
		.then(util.success(res), util.error(res));
	});
}
