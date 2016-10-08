var nodemailer = require('nodemailer');
var md5 = require('MD5');
var fs = require('fs');
var smtpTransport;
var urlServer;
var tmpMail = '/email/templateUser.html';
var mailOptions = {};
var q = require('q');
var config; 

var bringTemplateData = function (url) {
	var deferred = q.defer();
	var daUrl = __dirname + url;
	fs.readFile(daUrl, function (err, data) {
		if (err) {
			deferred.reject(err);
			return;
		}
		deferred.resolve(data.toString());
	});
	return deferred.promise;
};

var init = function (conf) {
	var smtpConfig = {
		host : 'cp21.grupo.host',
		port : 465,
		secure : true, // use SSL
		auth : {
			user : conf.MAIL_USR,
			pass : conf.MAIL_PASS
		}
	};
	urlServer = conf.SERVER_URL;
	smtpTransport = nodemailer.createTransport(smtpConfig);
	mailOptions.from = 'Info MobileOne <' + conf.MAIL_USR + '>';
	config = conf;
};

var sendMail = function (to, subject, body, isHtmlBody, attachments, cc, cco) {
	var deferred = q.defer();
	mailOptions.to = to;
	mailOptions.cc = cc ? cc : '';
	mailOptions.cco = cco ? cco : '';
	mailOptions.subject = subject;
	if (isHtmlBody) {
		mailOptions.html = body;
	} else {
		mailOptions.text = body;
	}
	if (attachments != undefined)
		mailOptions.attachments = attachments;
	console.log('Enviando mensaje');
	smtpTransport.sendMail(mailOptions, function (error, response) {
		if (error) {
			console.log(error);
			deferred.reject(error);
		} else {
			console.log('Message sent: ' + response.response);
			deferred.resolve(response);
		}
		// if you don't want to use this transport object anymore, uncomment following line
		//smtpTransport.close(); // shut down the connection pool, no more messages
	});
	return deferred.promise;
};

var sendActivationEmail = function (to, link, config) {
	var deferred = q.defer();
	bringTemplateData('/email/activar.html')
	.then(function (body) {
		var url = config.SERVER_URL + '/#/perfil/activar/' + link;
		body = body.replace(/\|url\|/g, url);
		sendMail(to, config.ACTIVAR_SUBJECT || 'Test Mail', body, true)
		.then(function (response) {
			deferred.resolve(response);
		},
			function (err) {
			deferred.reject(err);
		});
	},
		function (err) {
		deferred.reject(err);
	});
	return deferred.promise;
};

var sendForgotPasswordMail = function (to, link, urlServer) {
	var deferred = q.defer();
	bringTemplateData('/email/templateChangePassword.html')
	.then(function (body) {
		var url = urlServer + '/#/perfil/forgotpassword/' + link;
		console.log(url)
		body = body.replace('<emailUrl>', url);
		console.log('sending mail')
		sendMail(to, config.FORGOT_SUBJECT || 'Forgot your password?', body, true)
		.then(function (response) {
			console.log('DONE Sending Mail: ', response)
			deferred.resolve(response);
		},
			function (err) {
			console.log('error', err)
			deferred.reject(err);
		});
	},
		function (err) {
			console.log('error', err)
		deferred.reject(err);
	});
	return deferred.promise;
};

exports.sendConfirmateMail = function (email, password) {
	var subject = 'Confirmación de Correo';
	var token = md5(Date() + email);
	var urlEmail = urlServer + '/user/confirm/' + token;
	bringTemplateData(tmpMail)
	.then(function (body) {
		console.log('aqui? 1')
		var html = body;
		html = html.replace('<emailUrl>', urlEmail);
		html = html.replace('<emailUsuario>', email);
		html = html.replace('<emailPassword>', password);
		console.log('aquiiiii')
		return sendMail(email, subject, html, true)
	})
	.then(function () {
		console.log('done')
	})
	.catch (function (err) {
		console.log(err);
	});

	return token;
};

exports.init = init;
exports.sendMail = sendMail;
exports.sendActivationEmail = sendActivationEmail;
exports.sendForgotPasswordMail = sendForgotPasswordMail;
