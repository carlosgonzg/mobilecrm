var nodemailer = require('nodemailer');
var md5 = require('MD5');
var fs = require('fs');
var smtpTransport;
var urlServer;
var tmpMail = '/email/templateUser.html';
var mailOptions = {};
var q = require('q');
var config; 
var moment = require('moment');

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

var setAttachment = function (url, fileName) {
	var thisAttachs = [];
	var attach = {
	    path: url,
	    filename: fileName,
	    contents: fs.readFileSync(url)
  	};
  	thisAttachs.push(attach);
 	return thisAttachs;
}

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
	smtpTransport.sendMail(mailOptions, function (error, response) {
		if (error) {
			console.log(error);
			deferred.reject(error);
		} else {
			console.log('Message sent');
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
		var url = urlServer + '/#/changepassword/' + link;
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

var sendOrderService = function (invoice, mails, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/orderservice.html')
	.then(function (body) {
		console.log(mails)
		var url = config.SERVER_URL;
		body = body.replace('<emailUrl>', url);
		body = body.replace('<createdDate>', moment(invoice.date).format('MM/DD/YYYY'));
		body = body.replace('<clientName>', invoice.client.entity.fullName);
		body = body.replace('<clientAddress>', invoice.siteAddress.address1 + ', ' + invoice.siteAddress.city.description + ', ' + invoice.siteAddress.state.description + ' ' + invoice.siteAddress.zipcode);
		body = body.replace('<clientPhone>', invoice.phone.number);
		body = body.replace('<clientMail>', invoice.client.account.email);
		body = body.replace('<comment>', invoice.comment);
		body = body.replace('<pono>', invoice.pono);
		body = body.replace('<unitno>', invoice.unitno);
		body = body.replace('<isono>', invoice.isono);
		body = body.replace('<sor>', invoice.sor);
		//var attachments = setAttachment(file, fileName)
		console.log('sending mail')
		var subject = 'Customer: ' + invoice.client.company.entity.name + ' | Branch: ' + invoice.client.branch.name + ' | Service Order: ' + invoice.sor;
		sendMail(mails.join(', '), subject, body, true)
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

var sendOrderServiceUpdate = function (invoice, mails, username) {
	var deferred = q.defer();
	bringTemplateData('/email/templateOrderServiceUpdate.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		body = body.replace('<emailUrl>', url);
		body = body.replace('<invoiceNumber>', invoice);
		body = body.replace('<client>', username);
		var subject = 'Customer: ' + invoice.client.company.entity.name + ' | Branch: ' + invoice.client.branch.name + ' | Service Order: ' + invoice.sor;
		sendMail(mails.join(', '), subject, body, true)
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

var sendInvoice = function (invoice, mails, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/email/templateInvoice.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		body = body.replace('<emailUrl>', url);
		var attachments = setAttachment(file, fileName)
		sendMail(mails.join(', '), 'Invoice: ' + invoice + ' Created', body, true, attachments)
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

var sendInvoiceUpdate = function (invoice, mails, username) {
	var deferred = q.defer();
	bringTemplateData('/email/templateInvoiceUpdate.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		body = body.replace('<emailUrl>', url);
		body = body.replace('<invoiceNumber>', invoice);
		body = body.replace('<client>', username);
		sendMail(mails.join(', '), 'Invoice: ' + invoice + ' Updated', body, true)
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
		//console.log('aqui? 1')
		var html = body;
		html = html.replace('<emailUrl>', urlEmail);
		html = html.replace('<emailUsuario>', email);
		html = html.replace('<emailPassword>', password);
		//console.log('aquiiiii')
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



exports.sendInvoice = sendInvoice;
exports.sendInvoiceUpdate = sendInvoiceUpdate;
exports.sendOrderService = sendOrderService;
exports.sendOrderServiceUpdate = sendOrderServiceUpdate;
exports.init = init;
exports.sendMail = sendMail;
exports.sendActivationEmail = sendActivationEmail;
exports.sendForgotPasswordMail = sendForgotPasswordMail;
