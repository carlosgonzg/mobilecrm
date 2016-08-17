'use strict';

var q = require('q');
var util = require('../dto/util');

module.exports = function (prefix, app, ParentClass) {

	var success = util.success,
	error = util.error;

	//Insert
	app.post(prefix, function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		obj.crud.insert(req.body).then(success(res), error(res));
	});

	//Update
	app.put(prefix, function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		obj.crud.update(req.body.query, req.body.obj).then(success(res), error(res));
	});

	//Find
	app.get(prefix, function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		obj.crud.find(req.body).then(success(res), error(res));
	});
	//Find By Id
	app.get(prefix + '/:id', function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		var query = {
			_id: parseInt(req.params.id)
		};
		obj.crud.find(query).then(success(res), error(res));
	});

	//Delete by Id
	app.delete (prefix + '/:id', function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		obj.crud.remove (req.params.id).then(success(res), error(res));
	});

	//Count
	app.post(prefix + '/count', function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		obj.crud.count(req.body).then(success(res), error(res));
	});

	app.post(prefix + '/paginated', function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		obj.crud.paginatedSearch(req.body).then(success(res), error(res));
	});

	app.post(prefix + '/paginated/count', function (req, res) {
		var obj = new ParentClass(app.db, req.user);
		obj.crud.paginatedCount(req.body).then(success(res), error(res));
	});

};
