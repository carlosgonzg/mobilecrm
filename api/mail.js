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
var _ = require('lodash');

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

var sendMail = function (to, subject, body, isHtmlBody, attached, cc, cco, replyTo) {
	var deferred = q.defer();
	mailOptions.to = to;
	mailOptions.cc = cc ? cc : '';
	mailOptions.cco = cco ? cco : '';
	mailOptions.subject = subject;
	mailOptions.replyTo = replyTo || '';
	if (isHtmlBody) {
		mailOptions.html = body;
	} else {
		mailOptions.text = body;
	}
	if (attached)
		mailOptions.attachments = attached;

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

var sendServiceOrder = function (serviceOrder, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/serviceorder.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		console.log(url)
		body = body.replace('<emailUrl>', url);
		body = body.replace('<createdDate>', moment(serviceOrder.date).format('MM/DD/YYYY'));
		body = body.replace('<clientCompany>', serviceOrder.client.company ? serviceOrder.client.company.entity.name : 'None');
		body = body.replace('<clientBranch>', serviceOrder.client.branch ? serviceOrder.client.branch.name : 'None');
		body = body.replace('<customer>', serviceOrder.customer || 'None');
		body = body.replace('<customerPhone>', serviceOrder.phone ? (serviceOrder.phone.number || '') : 'None');
		body = body.replace('<sor>', serviceOrder.sor);
		body = body.replace('<unitno>', serviceOrder.unitno);
		body = body.replace('<pono>', serviceOrder.pono || '');
		body = body.replace('<isono>', serviceOrder.isono);
		body = body.replace('<clientName>', serviceOrder.client.entity.fullName);
		body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
		body = body.replace('<clientMail>', serviceOrder.client.account.email);
		body = body.replace('<clientAddress>', serviceOrder.siteAddress.address1 + ', ' + serviceOrder.siteAddress.city.description + ', ' + serviceOrder.siteAddress.state.description + ' ' + serviceOrder.siteAddress.zipcode);
		body = body.replace('<issue>', serviceOrder.issue || 'None');
		body = body.replace('<comment>', serviceOrder.comment || 'None');
		var contacts = '';
		for(var i = 0; i < serviceOrder.contacts.length; i++){
			if(serviceOrder.contacts[i].name)
				contacts += '<b>Contact #' + (i+1) + ':&nbsp;</b>' + (serviceOrder.contacts[i].name||'') + '.&nbsp;<b>Phone(' + (serviceOrder.contacts[i].phoneType.description || '')  + '):</b>&nbsp;' + (serviceOrder.contacts[i].number||'') + '<br/>';
		}
		body = body.replace('<contacts>', contacts || '');
		var company = 'Company: ' + (serviceOrder && serviceOrder.client && serviceOrder.client.company && serviceOrder.client.company.entity ? serviceOrder.client.company.entity.name : 'Not Defined');
		var branch = serviceOrder && serviceOrder.client && serviceOrder.client.branch ? 'Branch: ' + serviceOrder.client.branch.name : 'Client: ' + serviceOrder.client.entity.fullName;
		var subject = company + ' | ' + branch + ' | Service Order: ' + serviceOrder.sor;
		
		var attachments = [];
		if(serviceOrder.photos){
			for(var i = 0; i < serviceOrder.photos.length; i++){
				var photoDir = dirname + '/public/app' + serviceOrder.photos[i].url;
				//console.log(photoDir)
				attachments.push({
					filename: serviceOrder.photos[i].name,
					//content: fs.readFileSync(photoDir),
					contentType: serviceOrder.photos[i].type,
					path: photoDir
				});
			}
		}
		console.log('sending mail', subject);
		mails = _.uniq(mails);
		sendMail(mails.join(', '), subject, body, true, attachments, null, null, 'mf@mobileonecontainers.com')
		.then(function (response) {
			console.log('DONE Sending Mail: ', response)
			deferred.resolve(response);
		},
			function (err) {
			console.log('error?', err)
			deferred.reject(err);
		});
	},
		function (err) {
			console.log('error!', err)
		deferred.reject(err);
	});
	return deferred.promise;
};

var sendServiceOrderUpdate = function (serviceOrder, mails, user) {
	var deferred = q.defer();
	bringTemplateData('/email/templateServiceOrderUpdate.html')
	.then(function (body) {
		var url = config.SERVER_URL;

		body = body.replace('<emailUrl>', url);
		body = body.replace('<createdDate>', moment(serviceOrder.date).format('MM/DD/YYYY'));
		body = body.replace('<clientCompany>', serviceOrder.client.company ? serviceOrder.client.company.entity.name : 'None');
		body = body.replace('<clientBranch>', serviceOrder.client.branch ? serviceOrder.client.branch.name : 'None');
		body = body.replace('<customer>', serviceOrder.customer || 'None');
		body = body.replace('<customerPhone>', serviceOrder.phone ? (serviceOrder.phone.number || '') : 'None');
		body = body.replace('<sor>', serviceOrder.sor);
		body = body.replace('<unitno>', serviceOrder.unitno);
		body = body.replace('<pono>', serviceOrder.pono ? ('With PO Number: ' + serviceOrder.pono) : '');
		body = body.replace('<isono>', serviceOrder.isono);
		body = body.replace('<clientName>', serviceOrder.client.entity.fullName);
		body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
		body = body.replace('<clientMail>', serviceOrder.client.account.email);
		body = body.replace('<clientAddress>', serviceOrder.siteAddress.address1 + ', ' + serviceOrder.siteAddress.city.description + ', ' + serviceOrder.siteAddress.state.description + ' ' + serviceOrder.siteAddress.zipcode);
		body = body.replace('<issue>', serviceOrder.issue || 'None');
		body = body.replace('<comment>', serviceOrder.comment || 'None');

		var changesByUser = '';
		changesByUser += (user.entity.fullName || user.entity.name) + '<br/> Changes: ';
		var fieldsChanged = '';
		if(serviceOrder.fieldsChanged){
			for(var i = 0; i < serviceOrder.fieldsChanged.length; i++){
				if(serviceOrder.fieldsChanged[i].by != user._id)
					continue;
				fieldsChanged += serviceOrder.fieldsChanged[i].field;
				if(i != serviceOrder.fieldsChanged.length - 1){
					fieldsChanged += ', ';
				}
			}
		}
		changesByUser += fieldsChanged == '' ? 'None' : fieldsChanged;
		body = body.replace('<client>', changesByUser);
		var contacts = '';
		for(var i = 0; i < serviceOrder.contacts.length; i++){
			if(serviceOrder.contacts[i].name)
				contacts += '<b>Contact #' + (i+1) + ':&nbsp;</b>' +  serviceOrder.contacts[i].name + '.&nbsp;<b>Phone(' + serviceOrder.contacts[i].phoneType.description + '):</b>&nbsp;' + serviceOrder.contacts[i].number + '<br/>';
		}
		body = body.replace('<contacts>', contacts || '');

		var company = 'Company: ' + (serviceOrder && serviceOrder.client && serviceOrder.client.company && serviceOrder.client.company.entity ? serviceOrder.client.company.entity.name : 'Not Defined');
		var branch = serviceOrder && serviceOrder.client && serviceOrder.client.branch ? 'Branch: ' + serviceOrder.client.branch.name : 'Client: ' + serviceOrder.client.entity.fullName;
		var subject = company + ' | ' + branch + ' | Service Order: ' + serviceOrder.sor;
		console.log('sending mail', subject);
		mails = _.uniq(mails);
		sendMail(mails.join(', '), subject, body, true, null, null, null, 'mf@mobileonecontainers.com')
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

var sendInvoice = function (invoice, mails, cc, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/email/templateInvoice.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		body = body.replace('<emailUrl>', url);
		body = body.replace('<clientName>', invoice.client.entity.fullName);
		body = body.replace('<pono>', invoice.pono ? 'With PO Number: ' + invoice.pono : 'Without PO Number. Please provide PO Number for this Invoice');
		body = body.replace('<invoiceNumber>', invoice.invoiceNumber);
		body = body.replace('<confirm>', !invoice.pono ? '' : 'Please confirm as received.<br/><br/>I wait for your comment.<br/>');
		
		var attachments = setAttachment(file, fileName)
		var subject = (invoice.client.company ? invoice.client.company.entity.name + ' - ' : '') + 'Invoice: ' + invoice.invoiceNumber;
		if(!invoice.pono){
			subject += ' Without po number';
		}
		else {
			subject += '  with po number ' + invoice.pono;
		}
		subject += ' – MobileOne Restoration LLC' ;
		mails = _.uniq(mails);
		sendMail(mails.join(', '), subject, body, true, attachments, cc.join(', '), null, 'mf@mobileonecontainers.com')
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

var sendInvoiceUpdate = function (invoice, mails, user, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/email/templateInvoiceUpdate.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		body = body.replace('<emailUrl>', url);
		body = body.replace('<clientName>', invoice.client.entity.fullName);
		body = body.replace('<invoiceNumber>', invoice.invoiceNumber);
		body = body.replace('<pono>', invoice.pono ? 'With PO Number: ' + invoice.pono : 'Without PO Number. Please provide PO Number for this Invoice.');
		var subject = (invoice.client.company ? invoice.client.company.entity.name + ' - ' : '') + 'Invoice: ' + invoice.invoiceNumber;
		if(!invoice.pono){
			subject += ' Without po number';
		}
		else {
			subject += '  with po number ' + invoice.pono;
		}
		subject += ' – MobileOne Restoration LLC';
		var attachments = setAttachment(file, fileName);
		mails = _.uniq(mails);
		sendMail(mails.join(', '), subject, body, true, attachments, null, null, 'mf@mobileonecontainers.com')
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
	var subject = 'Confirm your Account';
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

var sendWorkOrder = function (workOrder, mails, dirname, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/email/templateWorkOrder.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		console.log(url)
		body = body.replace('<emailUrl>', url);
		body = body.replace('<clientCompany>', workOrder.client.company ? workOrder.client.company.entity.name : 'None');
		body = body.replace('<clientBranch>', workOrder.client.branch ? workOrder.client.branch.name : 'None');
		body = body.replace('<wor>', workOrder.wor);
		body = body.replace('<pono>', workOrder.pono ? 'With PO Number: ' + workOrder.pono : 'Without PO Number. Please provide PO Number for this Work Order.');
		var company = 'Company: ' + (workOrder && workOrder.client && workOrder.client.company && workOrder.client.company.entity ? workOrder.client.company.entity.name : 'Not Defined');
		var branch = workOrder && workOrder.client && workOrder.client.branch ? 'Branch: ' + workOrder.client.branch.name : 'Client: ' + workOrder.client.entity.fullName;
		var subject = company + ' | ' + branch + ' | Work Order: ' + workOrder.wor;
		var attachments = setAttachment(file, fileName)
		console.log('sending mail');
		mails = _.uniq(mails);
		sendMail(mails.join(', '), subject, body, true, attachments, null, null, 'mf@mobileonecontainers.com')
		.then(function (response) {
			console.log('DONE Sending Mail: ', response)
			deferred.resolve(response);
		},
			function (err) {
			console.log('error?', err)
			deferred.reject(err);
		});
	},
		function (err) {
			console.log('error!', err)
		deferred.reject(err);
	});
	return deferred.promise;
};

var sendWorkOrderUpdate = function (workOrder, mails, user, company) {
	var deferred = q.defer();
	bringTemplateData('/email/templateWorkOrderUpdate.html')
	.then(function (body) {
		var url = config.SERVER_URL;
		body = body.replace('<emailUrl>', url);
		body = body.replace('<createdDate>', moment(workOrder.date).format('MM/DD/YYYY'));
		body = body.replace('<clientCompany>', company.entity.name || 'None');
		body = body.replace('<clientBranch>', workOrder.client.branch ? workOrder.client.branch.name : 'None');
		body = body.replace('<wor>', workOrder.wor);
		body = body.replace('<unitno>', workOrder.unitno);
		body = body.replace('<pono>', workOrder.pono ? 'With PO Number: ' + workOrder.pono : 'Without PO Number. Please provide PO Number for this Work Order.');
		body = body.replace('<isono>', workOrder.isono);
		body = body.replace('<clientName>', workOrder.client.entity.fullName);
		body = body.replace('<clientPhone>', workOrder.client && workOrder.client.branch && workOrder.client.branch.phones && workOrder.client.branch.phones.length > 0 ? workOrder.client.branch.phones[0].number : 'None');
		body = body.replace('<clientMail>', workOrder.client.account.email);
		if(company.address){
			body = body.replace('<clientAddress>', company.address.address1 + ', ' + company.address.city.description + ', ' + company.address.state.description + ' ' + company.address.zipcode);
		}
		else {
			body = body.replace('<clientAddress>', 'None');
		}
		body = body.replace('<issue>', workOrder.issue || 'None');
		body = body.replace('<comment>', workOrder.comment || 'None');
		var changesByUser = '';
		changesByUser += (user.entity.fullName || user.entity.name) + ', Changes: ';
		var fieldsChanged = '';
		if(workOrder.fieldsChanged){
			for(var i = 0; i < workOrder.fieldsChanged.length; i++){
				if(workOrder.fieldsChanged[i].by != user._id)
					continue;
				fieldsChanged += workOrder.fieldsChanged[i].field;
				if(i != workOrder.fieldsChanged.length - 1){
					fieldsChanged += ', ';
				}
			}
		}
		changesByUser += fieldsChanged == '' ? 'None' : fieldsChanged;
		body = body.replace('<client>', changesByUser);

		var companyS = 'Company: ' + company.entity.name;
		var branch = workOrder && workOrder.client && workOrder.client.branch ? 'Branch: ' + workOrder.client.branch.name : 'Client: ' + workOrder.client.entity.fullName;
		var subject = companyS + ' | ' + branch + ' | Work Order: ' + workOrder.wor;
		console.log('sending mail', subject);
		mails = _.uniq(mails);
		sendMail(mails.join(', '), subject, body, true, null, null, null, 'mf@mobileonecontainers.com')
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


exports.sendInvoice = sendInvoice;
exports.sendInvoiceUpdate = sendInvoiceUpdate;
exports.sendServiceOrder = sendServiceOrder;
exports.sendServiceOrderUpdate = sendServiceOrderUpdate;
exports.sendWorkOrder = sendWorkOrder;
exports.sendWorkOrderUpdate = sendWorkOrderUpdate;
exports.init = init;
exports.sendMail = sendMail;
exports.sendActivationEmail = sendActivationEmail;
exports.sendForgotPasswordMail = sendForgotPasswordMail;
