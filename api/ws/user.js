var q = require('q');
var User = require('../dto/user');
var util = require('../dto/util');

module.exports = function (prefix, app, secret, config) {
	
	//actual User
	app.get(prefix + '/actual', function (req, res) {
		var user = new User(app.db, secret, req.user);
		user.getActual()
		.then(util.success(res), util.error(res));
	});
	//Change password
	app.post('/user/changePassword', function (req, res) {
		var user = new User(app.db, secret, req.user);
		user.changePassword(req.body.username, req.body.password)
		.then(util.success(res), util.error(res));
	});

	//Forget Password
	app.post('/user/forgetPassword', function (req, res) {
		var user = new User(app.db, secret, req.user);
		user.forgetPassword(req.body.email, config.SERVER_URL)
		.then(util.success(res), util.error(res));
	});

	//Sign up
	app.post('/user/register', function (req, res) {
		var user = new User(app.db, secret);
		user.register(req.body)
		.then(util.success(res), util.error(res));
	});

	//Sign up User
	app.post(prefix + '/register', function (req, res) {
		var user = new User(app.db, secret, req.user);
		user.register(req.body.obj, req.user)
		.then(util.success(res), util.error(res));
	});

	app.get('/user/confirm/:token', function (req, res) {
		var user = new User(app.db, secret);
		user.confirm(req.params.token)
		.then(function () {
			res.redirect('/#/register/' + req.params.token);
		}, util.error(res));
	});

	//login
	app.post('/user/login', function (req, res) {
		var user = new User(app.db, secret);
		user.login(req.body.email, req.body.password)
		.then(util.success(res), util.error(res));
	});

	//get roleoptions
	app.get(prefix + '/roleoptions', function (req, res) {
		var user = new User(app.db, secret, req.user);
		user.getRoleOptions(req.user)
		.then(util.success(res), util.error(res));
	});
	
	require('./crud')(prefix, app, User);
	
	app.post(prefix, function(req, res){
		res.json({ message: 'Not happening bruh' })
	});
};
