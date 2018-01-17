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
		host: 'cp21.grupo.host',
		port: 465,
		secure: true, // use SSL
		auth: {
			user: conf.MAIL_USR,
			pass: conf.MAIL_PASS
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
	else {
		mailOptions.attachments = [];
	}
   	smtpTransport.sendMail(mailOptions, function (error, response) {
		if (error) {
			console.log(error);
			deferred.reject(error);
		} else {
			console.log('Message sent');
			deferred.resolve(response);
		}
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
			body = body.replace('<createdBy>', serviceOrder.createdBy.entity ? serviceOrder.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', serviceOrder.client.company ? serviceOrder.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', serviceOrder.client.branch ? serviceOrder.client.branch.name : 'None');
			body = body.replace('<customer>', serviceOrder.customer || 'None');
			body = body.replace('<customerPhone>', serviceOrder.phone ? (serviceOrder.phone.number || '') : 'None');
			body = body.replace('<sor>', serviceOrder.sor);
			body = body.replace('<unitno>', serviceOrder.unitno || '');
			body = body.replace('<unitSize>', serviceOrder.unitSize || '');
			body = body.replace('<pono>', serviceOrder.pono || '');
			body = body.replace('<isono>', serviceOrder.isono || '');
			body = body.replace('<clientName>', serviceOrder.client.entity.fullName);
			body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', serviceOrder.client.account.email);
			body = body.replace('<clientAddress>', serviceOrder.siteAddress.address1 + ', ' + serviceOrder.siteAddress.city.description + ', ' + serviceOrder.siteAddress.state.description + ' ' + serviceOrder.siteAddress.zipcode);
			body = body.replace('<issue>', serviceOrder.issue || 'None');
			body = body.replace('<comment>', serviceOrder.comment || 'None');
			var contacts = '';
			for (var i = 0; i < serviceOrder.contacts.length; i++) {
				if (serviceOrder.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (serviceOrder.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (serviceOrder.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (serviceOrder.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (serviceOrder && serviceOrder.client && serviceOrder.client.company && serviceOrder.client.company.entity ? serviceOrder.client.company.entity.name : 'Not Defined');
			var branch = serviceOrder && serviceOrder.client && serviceOrder.client.branch ? '' + serviceOrder.client.branch.name : '' + serviceOrder.client.entity.fullName;
			var subject = 'Service Order: ' + serviceOrder.sor + ' | ' + company + ' | ' + branch;

			var serviceOrderAttachments = [];
			if (serviceOrder.photos) {
				for (var i = 0; i < serviceOrder.photos.length; i++) {
					var photoDir = dirname + '/public/app' + serviceOrder.photos[i].url;
					//console.log(photoDir)
					serviceOrderAttachments.push({
						filename: serviceOrder.photos[i].name,
						//content: fs.readFileSync(photoDir),
						contentType: serviceOrder.photos[i].type,
						path: photoDir
					});
				}
			}
			console.log('sending mail', subject);
			mails = _.uniq(mails);
			var newMails = ""
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
			sendMail(mails.join(', '), subject, body, true, serviceOrderAttachments, null, null, 'mf@mobileonecontainers.com')
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

var sendServiceOrderDelete = function (serviceOrder, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/serviceorderDelete.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			console.log(url)
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(serviceOrder.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', serviceOrder.createdBy.entity ? serviceOrder.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', serviceOrder.client.company ? serviceOrder.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', serviceOrder.client.branch ? serviceOrder.client.branch.name : 'None');
			body = body.replace('<customer>', serviceOrder.customer || 'None');
			body = body.replace('<customerPhone>', serviceOrder.phone ? (serviceOrder.phone.number || '') : 'None');
			body = body.replace('<sor>', serviceOrder.sor);
			body = body.replace('<unitno>', serviceOrder.unitno || '');
			body = body.replace('<unitSize>', serviceOrder.unitSize || '');
			body = body.replace('<pono>', serviceOrder.pono || '');
			body = body.replace('<isono>', serviceOrder.isono || '');
			body = body.replace('<contract>', serviceOrder.contract || '');
			body = body.replace('<clientName>', serviceOrder.client.entity.fullName);
			body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', serviceOrder.client.account.email);
			body = body.replace('<clientAddress>', serviceOrder.siteAddress.address1 + ', ' + serviceOrder.siteAddress.city.description + ', ' + serviceOrder.siteAddress.state.description + ' ' + serviceOrder.siteAddress.zipcode);
			body = body.replace('<issue>', serviceOrder.issue || 'None');
			body = body.replace('<comment>', serviceOrder.comment || 'None');
			var contacts = '';
			for (var i = 0; i < serviceOrder.contacts.length; i++) {
				if (serviceOrder.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (serviceOrder.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (serviceOrder.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (serviceOrder.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (serviceOrder && serviceOrder.client && serviceOrder.client.company && serviceOrder.client.company.entity ? serviceOrder.client.company.entity.name : 'Not Defined');
			var branch = serviceOrder && serviceOrder.client && serviceOrder.client.branch ? '' + serviceOrder.client.branch.name : '' + serviceOrder.client.entity.fullName;
			var subject = 'DELETED - Service Order: ' + serviceOrder.sor + ' | ' + company + ' | ' + branch;

			var serviceOrderAttachments = [];
			if (serviceOrder.photos) {
				for (var i = 0; i < serviceOrder.photos.length; i++) {
					var photoDir = dirname + '/public/app' + serviceOrder.photos[i].url;
					//console.log(photoDir)
					serviceOrderAttachments.push({
						filename: serviceOrder.photos[i].name,
						//content: fs.readFileSync(photoDir),
						contentType: serviceOrder.photos[i].type,
						path: photoDir
					});
				}
			}
			console.log('sending mail', subject);
			mails = _.uniq(mails);
			sendMail('mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', subject, body, true, serviceOrderAttachments, null, null, 'mf@mobileonecontainers.com')
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
			body = body.replace('<unitno>', serviceOrder.unitno || '');
			body = body.replace('<unitSize>', serviceOrder.unitSize || '');
			body = body.replace('<pono>', serviceOrder.pono ? ('With PO Number: ' + serviceOrder.pono) : '');
			body = body.replace('<isono>', serviceOrder.isono || '');
			body = body.replace('<contract>', serviceOrder.contract || '');
			body = body.replace('<clientName>', serviceOrder.client.entity.fullName);
			body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', serviceOrder.client.account.email);
			body = body.replace('<clientAddress>', serviceOrder.siteAddress.address1 + ', ' + serviceOrder.siteAddress.city.description + ', ' + serviceOrder.siteAddress.state.description + ' ' + serviceOrder.siteAddress.zipcode);
			body = body.replace('<issue>', serviceOrder.issue || 'None');
			body = body.replace('<comment>', serviceOrder.comment || 'None');

			var changesByUser = '';
			changesByUser += (user.entity.fullName || user.entity.name) + '<br/> Changes: ';
			var fieldsChanged = '';
			if (serviceOrder.fieldsChanged) {
				for (var i = 0; i < serviceOrder.fieldsChanged.length; i++) {
					if (serviceOrder.fieldsChanged[i].by != user._id)
						continue;
					fieldsChanged += serviceOrder.fieldsChanged[i].field;
					if (i != serviceOrder.fieldsChanged.length - 1) {
						fieldsChanged += ', ';
					}
				}
			}
			var addedItems = '';
			if (serviceOrder.addedItems) {
				for (var i = 0; i < serviceOrder.addedItems.length; i++) {
					addedItems += serviceOrder.addedItems[i].description;
					if (i != serviceOrder.addedItems.length - 1) {
						addedItems += ', ';
					}
				}
			}

			var removedItems = '';
			if (serviceOrder.removedItems) {
				for (var i = 0; i < serviceOrder.removedItems.length; i++) {
					removedItems += serviceOrder.removedItems[i].description;
					if (i != serviceOrder.removedItems.length - 1) {
						removedItems += ', ';
					}
				}
			}

			console.log(addedItems, removedItems)
			changesByUser += fieldsChanged == '' ? 'None' : fieldsChanged;
			changesByUser += addedItems == '' ? '' : '<br/> Added Items: ' + addedItems;
			changesByUser += removedItems == '' ? '' : '<br/> Removed Items: ' + removedItems;
			console.log(changesByUser, addedItems, removedItems)
			body = body.replace('<client>', changesByUser);
			var contacts = '';
			for (var i = 0; i < serviceOrder.contacts.length; i++) {
				if (serviceOrder.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + serviceOrder.contacts[i].name + '.&nbsp;<br/><b>Phone(' + serviceOrder.contacts[i].phoneType.description + '):</b>&nbsp;' + serviceOrder.contacts[i].number + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');

			var company = '' + (serviceOrder && serviceOrder.client && serviceOrder.client.company && serviceOrder.client.company.entity ? serviceOrder.client.company.entity.name : 'Not Defined');
			var branch = serviceOrder && serviceOrder.client && serviceOrder.client.branch ? '' + serviceOrder.client.branch.name : '' + serviceOrder.client.entity.fullName;
			var subject = 'Service Order: ' + serviceOrder.sor + ' | ' + company + ' | ' + branch;

			console.log('sending mail', subject);
			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
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

			var companyName = "";

			if (invoice.client.company) {
				companyName = invoice.client.company._id === 7 ? "Portable Storage - " : invoice.client.company.entity.name + ' - ';
			}

			var subject = companyName + 'Invoice: ' + invoice.invoiceNumber;
			if (!invoice.pono) {
				subject += ' Without po number';
			}
			else {
				subject += '  with po number ' + invoice.pono;
			}
			subject += ' – MobileOne Restoration LLC';
			mails = _.uniq(mails);

			var newMails = ""
			if (cc.indexOf('mf@mobileonecontainers.com') != -1) {
				if (cc.indexOf('ar@mobileonecontainers.com') != -1) {
					cc.indexOf('ar@mobileonecontainers.com')
				}
				cc.push("nr@mobileonecontainers.com")
			}
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

var sendInvoiceDelete = function (invoice, mails, cc, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/email/templateInvoiceDelete.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			body = body.replace('<emailUrl>', url);
			body = body.replace('<clientName>', invoice.client.entity.fullName);
			body = body.replace('<pono>', invoice.pono ? 'With PO Number: ' + invoice.pono : 'Without PO Number.');
			body = body.replace('<invoiceNumber>', invoice.invoiceNumber);
			body = body.replace('<confirm>', !invoice.pono ? '' : 'Please confirm as received.<br/><br/>I wait for your comment.<br/>');

			var attachments = setAttachment(file, fileName)

			var companyName = "";

			if (invoice.client.company) {
				companyName = invoice.client.company._id === 7 ? "Portable Storage - " : invoice.client.company.entity.name + ' - ';
			}

			var subject = "DELETED - " + companyName + 'Invoice: ' + invoice.invoiceNumber;
			if (!invoice.pono) {
				subject += ' Without po number';
			}
			else {
				subject += '  with po number ' + invoice.pono;
			}
			subject += ' – MobileOne Restoration LLC';
			mails = _.uniq(mails);
			sendMail('mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', subject, body, true, attachments, null, null, 'mf@mobileonecontainers.com')
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

			var companyName = "";

			if (invoice.client.company) {
				companyName = invoice.client.company._id === 7 ? "Portable Storage - " : invoice.client.company.entity.name + ' - ';
			}

			var subject = companyName + 'Invoice: ' + invoice.invoiceNumber;
			if (!invoice.pono) {
				subject += ' Without po number';
			}
			else {
				subject += '  with po number ' + invoice.pono;
			}
			subject += ' – MobileOne Restoration LLC';
			var attachments = setAttachment(file, fileName);
			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
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
			var newMails = ""
			if (email.indexOf('mf@mobileonecontainers.com') != -1) {
				newMails = ", ar@mobileonecontainers.com, nr@mobileonecontainers.com"
			}

			return sendMail(email + newMails, subject, html, true)
		})
		.then(function () {
			console.log('done')
		})
		.catch(function (err) {
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
			body = body.replace('<createdBy>', workOrder.createdBy.entity ? workOrder.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', workOrder.client.company ? workOrder.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', workOrder.client.branch ? workOrder.client.branch.name : 'None');
			body = body.replace('<wor>', workOrder.wor);
			body = body.replace('<pono>', workOrder.pono ? 'With PO Number: ' + workOrder.pono : 'Without PO Number. Please provide PO Number for this Work Order.');
			var company = '' + (workOrder && workOrder.client && workOrder.client.company && workOrder.client.company.entity ? workOrder.client.company.entity.name : 'Not Defined');
			var branch = workOrder && workOrder.client && workOrder.client.branch ? '' + workOrder.client.branch.name : '' + workOrder.client.entity.fullName;
			var subject = 'Work Order: ' + workOrder.wor + ' | ' + company + ' | ' + branch;
			var attachments = setAttachment(file, fileName)
			console.log('sending mail');
			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("nr@mobileonecontainers.com")
			}
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

var sendWorkOrderDelete = function (workOrder, mails, dirname, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/email/templateWorkOrderDeleted.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			console.log(url)
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdBy>', workOrder.createdBy.entity ? workOrder.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', workOrder.client.company ? workOrder.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', workOrder.client.branch ? workOrder.client.branch.name : 'None');
			body = body.replace('<wor>', workOrder.wor);
			body = body.replace('<pono>', workOrder.pono ? 'With PO Number: ' + workOrder.pono : 'Without PO Number. Please provide PO Number for this Work Order.');
			var company = '' + (workOrder && workOrder.client && workOrder.client.company && workOrder.client.company.entity ? workOrder.client.company.entity.name : 'Not Defined');
			var branch = workOrder && workOrder.client && workOrder.client.branch ? '' + workOrder.client.branch.name : '' + workOrder.client.entity.fullName;
			var subject = 'DELETED - Work Order: ' + workOrder.wor + ' | ' + company + ' | ' + branch;
			var attachments = setAttachment(file, fileName)
			console.log('sending mail');
			mails = _.uniq(mails);
			sendMail('mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', subject, body, true, attachments, null, null, 'mf@mobileonecontainers.com')
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
			body = body.replace('<unitno>', workOrder.unitno || '');
			body = body.replace('<pono>', workOrder.pono ? 'With PO Number: ' + workOrder.pono : 'Without PO Number. Please provide PO Number for this Work Order.');
			body = body.replace('<isono>', workOrder.isono || '');
			body = body.replace('<clientName>', workOrder.client.entity.fullName);
			body = body.replace('<clientPhone>', workOrder.client && workOrder.client.branch && workOrder.client.branch.phones && workOrder.client.branch.phones.length > 0 ? workOrder.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', workOrder.client.account.email);
			if (company.address) {
				body = body.replace('<clientAddress>', company.address.address1 + ', ' + company.address.city.description + ', ' + company.address.state.description + ' ' + company.address.zipcode);
			}
			else {
				body = body.replace('<clientAddress>', 'None');
			}

			body = body.replace('<issue>', workOrder.issue || 'None');
			body = body.replace('<comment>', workOrder.comment || 'None');
			var changesByUser = '';
			changesByUser += (user.entity.fullName || user.entity.name) + '<br> Changes: ';
			var fieldsChanged = '';
			if (workOrder.fieldsChanged) {
				for (var i = 0; i < workOrder.fieldsChanged.length; i++) {
					if (workOrder.fieldsChanged[i].by != user._id)
						continue;
					fieldsChanged += workOrder.fieldsChanged[i].field;
					if (i != workOrder.fieldsChanged.length - 1) {
						fieldsChanged += ', ';
					}
				}
			}

			var addedItems = '';
			if (workOrder.addedItems) {
				for (var i = 0; i < workOrder.addedItems.length; i++) {
					addedItems += workOrder.addedItems[i].description;
					if (i != workOrder.addedItems.length - 1) {
						addedItems += ', ';
					}
				}
			}

			var removedItems = '';
			if (workOrder.removedItems) {
				for (var i = 0; i < workOrder.removedItems.length; i++) {
					removedItems += workOrder.removedItems[i].description;
					if (i != workOrder.removedItems.length - 1) {
						removedItems += ', ';
					}
				}
			}

			changesByUser += fieldsChanged == '' ? 'None' : fieldsChanged;
			changesByUser += addedItems == '' ? '' : '<br> Added Items: ' + addedItems;
			changesByUser += removedItems == '' ? '' : '<br> Removed Items: ' + removedItems;
			body = body.replace('<client>', changesByUser);

			var companyS = '' + company.entity.name;
			var branch = workOrder && workOrder.client && workOrder.client.branch ? '' + workOrder.client.branch.name : '' + workOrder.client.entity.fullName;
			var subject = 'Work Order: ' + workOrder.wor + ' | ' + companyS + ' | ' + branch;
			console.log('sending mail', subject);
			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
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

var sendDeliveryOrder = function (deliveryOrder, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/deliveryorder.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			console.log(url)

			var adressArray = deliveryOrder.siteAddressFrom.address1 + ", " + deliveryOrder.siteAddressFrom.city.id + ", " + deliveryOrder.siteAddressFrom.city.stateId
			var pickAdress = adressArray || deliveryOrder.addresstr;
			var addressto = ""
			var AddRoute = ""

			if (deliveryOrder.additionalRoute && deliveryOrder.additionalRoute.Start) {
				if (deliveryOrder.additionalRoute.waypts) {
					var additionalrouteStart = deliveryOrder.additionalRoute ? (deliveryOrder.additionalRoute.Start ? '&nbsp;Start : ' + deliveryOrder.additionalRoute.Start : "") : ""
					var additionalRouteEnd = deliveryOrder.additionalRoute ? (deliveryOrder.additionalRoute.End ? '&nbsp;End : ' + deliveryOrder.additionalRoute.End : "") : ""
					var waypts = ""

					for (let I = 0; I < deliveryOrder.additionalRoute.waypts.length; I++) {
						var N = I + 1;
						const element = deliveryOrder.additionalRoute.waypts[I];
						waypts += '<b>Way Points # </b>' + N + ' - ' + element.location + ' <br />'
					}
					AddRoute = addressto + '' + additionalrouteStart + '. ' + waypts + " " + additionalRouteEnd
				} else {
					AddRoute = addressto
				}
			}

			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(deliveryOrder.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', deliveryOrder.createdBy.entity ? deliveryOrder.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', deliveryOrder.client.company ? deliveryOrder.client.company.entity.name : 'None');
			body = body.replace('<dor>', deliveryOrder.dor);
			body = body.replace('<unitSize>', deliveryOrder.unitSize || '');
			body = body.replace('<serialno>', deliveryOrder.unitno || '');
			body = body.replace('<clientBranch>', deliveryOrder.client.branch ? deliveryOrder.client.branch.name : 'None');
			body = body.replace('<customer>', deliveryOrder.customer || 'None');
			body = body.replace('<customerPhone>', deliveryOrder.phone ? (deliveryOrder.phone.number || '') : 'None');
			body = body.replace('<entrance>', deliveryOrder.typeTruck.description);
			body = body.replace('<servicetype>', deliveryOrder.ServiceType.item);
			body = body.replace('<pono>', deliveryOrder.pono || '');
			body = body.replace('<pickupdate>', moment(deliveryOrder.pickupDate).format('MM/DD/YYYY'));
			body = body.replace('<pickuptime>', moment(deliveryOrder.pickupTime).format('HH:mm'));
			body = body.replace('<clientName>', deliveryOrder.client.entity.fullName);
			body = body.replace('<pickAddress>', pickAdress || '');
			body = body.replace('<deliveryAddress>', deliveryOrder.siteAddress ? deliveryOrder.siteAddress.address1 + ', ' + deliveryOrder.siteAddress.city.description + ', ' + deliveryOrder.siteAddress.state.description + ' ' + deliveryOrder.siteAddress.zipcode : '');

			body = body.replace('<Multipleroutes>', AddRoute || 'None');

			body = body.replace('<Clientcomment>', deliveryOrder.clientcomment || 'None');
			body = body.replace('<comment>', deliveryOrder.comments || 'None');

			var contacts = '';
			for (var i = 0; i < deliveryOrder.contacts.length; i++) {
				if (deliveryOrder.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (deliveryOrder.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (deliveryOrder.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (deliveryOrder.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (deliveryOrder && deliveryOrder.client && deliveryOrder.client.company && deliveryOrder.client.company.entity ? deliveryOrder.client.company.entity.name : 'Not Defined');
			var branch = deliveryOrder && deliveryOrder.client && deliveryOrder.client.branch ? '' + deliveryOrder.client.branch.name : '' + deliveryOrder.client.entity.fullName;
			var subject = 'Delivery Order: ' + deliveryOrder.dor + ' | ' + company + ' | ' + branch;

			var deliveryOrderAttachments = [];
			if (deliveryOrder.docs) {
				for (var i = 0; i < deliveryOrder.docs.length; i++) {
					var docDir = dirname + '/public/app' + deliveryOrder.docs[i].url;

					deliveryOrderAttachments.push({
						filename: deliveryOrder.docs[i].name,
						contentType: deliveryOrder.docs[i].type,
						path: docDir
					});
				}
			}
			console.log('sending mail', subject);
			mails = _.uniq(mails);
			var newMails = ""
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
			sendMail(mails.join(', '), subject, body, true, deliveryOrderAttachments, null, null, 'mf@mobileonecontainers.com')
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


var sendDeliveryOrderUpdate = function (deliveryOrder, mails, user, dirname) {
	var deferred = q.defer();
	bringTemplateData('/email/templateDeliveryOrderUpdate.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			var adressArray = deliveryOrder.siteAddressFrom.address1 + ", " + deliveryOrder.siteAddressFrom.city.id + ", " + deliveryOrder.siteAddressFrom.city.stateId
			var pickAdress = deliveryOrder.addresstr || adressArray;
			var addressto = ""
			var AddRoute = ""

			if (deliveryOrder.additionalRoute && deliveryOrder.additionalRoute.Start) {
				if (deliveryOrder.additionalRoute.waypts) {
					var additionalrouteStart = deliveryOrder.additionalRoute ? (deliveryOrder.additionalRoute.Start ? '&nbsp;Start : ' + deliveryOrder.additionalRoute.Start : "") : ""
					var additionalRouteEnd = deliveryOrder.additionalRoute ? (deliveryOrder.additionalRoute.End ? '&nbsp;End : ' + deliveryOrder.additionalRoute.End : "") : ""
					var waypts = ""

					for (let I = 0; I < deliveryOrder.additionalRoute.waypts.length; I++) {
						var N = I + 1;
						const element = deliveryOrder.additionalRoute.waypts[I];
						waypts += '<b>Way Points # </b>' + N + ' - ' + element.location + ' <br />'
					}
					AddRoute = addressto + '' + additionalrouteStart + '. ' + waypts + " " + additionalRouteEnd
				} else {
					AddRoute = addressto
				}
			}

			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(deliveryOrder.date).format('MM/DD/YYYY'));
			body = body.replace('<clientCompany>', deliveryOrder.client.company ? deliveryOrder.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', deliveryOrder.client.branch ? deliveryOrder.client.branch.name : 'None');
			body = body.replace('<customer>', deliveryOrder.customer || 'None');
			body = body.replace('<customerPhone>', deliveryOrder.phone ? (deliveryOrder.phone.number || '') : 'None');
			body = body.replace('<entrance>', deliveryOrder.typeTruck.description);
			body = body.replace('<servicetype>', deliveryOrder.ServiceType.item);
			body = body.replace('<dor>', deliveryOrder.dor);
			body = body.replace('<unitSize>', deliveryOrder.unitSize || '');
			body = body.replace('<serialno>', deliveryOrder.unitno || '');
			body = body.replace('<pono>', deliveryOrder.pono || '');
			body = body.replace('<isono>', deliveryOrder.isono || '');
			body = body.replace('<contract>', deliveryOrder.contract || '');
			body = body.replace('<clientName>', deliveryOrder.client.entity.fullName);
			body = body.replace('<clientPhone>', deliveryOrder.client && deliveryOrder.client.branch && deliveryOrder.client.branch.phones && deliveryOrder.client.branch.phones.length > 0 ? deliveryOrder.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', deliveryOrder.client.account.email);
			body = body.replace('<pickAddress>', pickAdress || '');
			body = body.replace('<deliveryAddress>', deliveryOrder.siteAddress ? deliveryOrder.siteAddress.address1 + ', ' + deliveryOrder.siteAddress.city.description + ', ' + deliveryOrder.siteAddress.state.description + ' ' + deliveryOrder.siteAddress.zipcode : '');
			body = body.replace('<issue>', deliveryOrder.issue || 'None');
			body = body.replace('<comment>', deliveryOrder.comments || 'None');
			body = body.replace('<pickupdate>', moment(deliveryOrder.pickupDate).format('MM/DD/YYYY'));
			body = body.replace('<pickuptime>', moment(deliveryOrder.pickupTime).format('HH:mm'));

			body = body.replace('<Multipleroutes>', AddRoute || 'None');

			body = body.replace('<Clientcomment>', deliveryOrder.clientcomment || 'None');

			var changesByUser = '';
			changesByUser += (user.entity.fullName || user.entity.name) + '<br/> Changes: ';
			var fieldsChanged = '';
			if (deliveryOrder.fieldsChanged) {
				for (var i = 0; i < deliveryOrder.fieldsChanged.length; i++) {
					if (deliveryOrder.fieldsChanged[i].by != user._id)
						continue;
					fieldsChanged += deliveryOrder.fieldsChanged[i].field;
					if (i != deliveryOrder.fieldsChanged.length - 1) {
						fieldsChanged += ', ';
					}
				}
			}
			changesByUser += fieldsChanged == '' ? 'None' : fieldsChanged;
			body = body.replace('<client>', changesByUser);
			var contacts = '';
			for (var i = 0; i < deliveryOrder.contacts.length; i++) {
				if (deliveryOrder.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + deliveryOrder.contacts[i].name + '.&nbsp;<br/><b>Phone(' + deliveryOrder.contacts[i].phoneType.description + '):</b>&nbsp;' + deliveryOrder.contacts[i].number + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');

			var company = '' + (deliveryOrder && deliveryOrder.client && deliveryOrder.client.company && deliveryOrder.client.company.entity ? deliveryOrder.client.company.entity.name : 'Not Defined');
			var branch = deliveryOrder && deliveryOrder.client && deliveryOrder.client.branch ? '' + deliveryOrder.client.branch.name : '' + deliveryOrder.client.entity.fullName;
			var subject = 'Delivery Order: ' + deliveryOrder.dor + ' | ' + company + ' | ' + branch;

			var deliveryOrderAttachments = [];
			if (deliveryOrder.docs) {
				for (var i = 0; i < deliveryOrder.docs.length; i++) {
					var docDir = dirname + '/public/app' + deliveryOrder.docs[i].url;

					deliveryOrderAttachments.push({
						filename: deliveryOrder.docs[i].name,
						contentType: deliveryOrder.docs[i].type,
						path: docDir
					});
				}
			}

			console.log('sending mail', subject);
			mails = _.uniq(mails);
			var newMails = ""
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
			sendMail(mails.join(', '), subject, body, true, deliveryOrderAttachments, null, null, 'mf@mobileonecontainers.com')
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

var sendDeliveryOrderDelete = function (deliveryOrder, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/deliveryorder.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			console.log(url)
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(deliveryOrder.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', deliveryOrder.createdBy.entity ? deliveryOrder.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', deliveryOrder.client.company ? deliveryOrder.client.company.entity.name : 'None');
			body = body.replace('<dor>', deliveryOrder.dor);
			body = body.replace('<unitSize>', deliveryOrder.unitSize || '');
			body = body.replace('<serialno>', deliveryOrder.unitno || '');
			body = body.replace('<clientBranch>', deliveryOrder.client.branch ? deliveryOrder.client.branch.name : 'None');
			body = body.replace('<customer>', deliveryOrder.customer || 'None');
			body = body.replace('<customerPhone>', deliveryOrder.phone ? (deliveryOrder.phone.number || '') : 'None');
			body = body.replace('<entrance>', deliveryOrder.typeTruck ? deliveryOrder.typeTruck.description : '');
			body = body.replace('<pono>', deliveryOrder.pono || '');
			body = body.replace('<pickupdate>', moment(deliveryOrder.pickupDate).format('MM/DD/YYYY'));
			body = body.replace('<pickuptime>', moment(deliveryOrder.pickupTime).format('HH:mm'));
			body = body.replace('<clientName>', deliveryOrder.client.entity.fullName);
			body = body.replace('<pickAddress>', deliveryOrder.addresstr || '');
			body = body.replace('<deliveryAddress>', deliveryOrder.siteAddress ? deliveryOrder.siteAddress.address1 + ', ' + deliveryOrder.siteAddress.city.description + ', ' + deliveryOrder.siteAddress.state.description + ' ' + deliveryOrder.siteAddress.zipcode : '');
			body = body.replace('<Clientcomment>', deliveryOrder.clientcomment || 'None');
			body = body.replace('<comment>', deliveryOrder.comments || 'None');
			var contacts = '';
			for (var i = 0; i < deliveryOrder.contacts.length; i++) {
				if (deliveryOrder.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (deliveryOrder.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (deliveryOrder.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (deliveryOrder.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = 'Company: ' + (deliveryOrder && deliveryOrder.client && deliveryOrder.client.company && deliveryOrder.client.company.entity ? deliveryOrder.client.company.entity.name : 'Not Defined');
			var branch = deliveryOrder && deliveryOrder.client && deliveryOrder.client.branch ? 'Branch: ' + deliveryOrder.client.branch.name : 'Client: ' + deliveryOrder.client.entity.fullName;
			var subject = 'DELETED - Delivery Order: ' + deliveryOrder.sor + ' | ' + company + ' | ' + branch;

			var deliveryOrderAttachments = [];
			if (deliveryOrder.docs) {
				for (var i = 0; i < deliveryOrder.docs.length; i++) {
					var docDir = dirname + '/public/app' + deliveryOrder.docs[i].url;

					deliveryOrderAttachments.push({
						filename: deliveryOrder.docs[i].name,
						contentType: deliveryOrder.docs[i].type,
						path: docDir
					});
				}
			}
			console.log('sending mail', subject);
			mails = _.uniq(mails);
			sendMail('mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', subject, body, true, deliveryOrderAttachments, null, null, 'mf@mobileonecontainers.com')
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


var sendQuotes = function (serviceQuotes, mails, cc, file, fileName) {
	var deferred = q.defer();
	bringTemplateData('/email/templateQuotes.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			body = body.replace('<emailUrl>', url);
			body = body.replace('<clientName>', serviceQuotes.client.entity.fullName);
			body = body.replace('<quotesNumber>', serviceQuotes.quotesNumber);
			body = body.replace('<confirm>', !serviceQuotes.pono ? '' : 'Please confirm as received.<br/><br/>I wait for your comment.<br/>');

			var attachments = setAttachment(file, fileName)

			var subject = "Estimate : " + serviceQuotes.quotesNumber + ' – MobileOne Restoration LLC';
			mails = _.uniq(mails);

			sendMail(mails.join(', '), subject, body, true, attachments, 'mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', null, 'mf@mobileonecontainers.com')
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

var sendDeliveryOrderDelete = function (deliveryOrder, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/deliveryorderDelete.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(deliveryOrder.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', deliveryOrder.createdBy.entity ? deliveryOrder.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', deliveryOrder.client.company ? deliveryOrder.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', deliveryOrder.client.branch ? deliveryOrder.client.branch.name : 'None');
			body = body.replace('<customer>', deliveryOrder.customer || 'None');
			body = body.replace('<customerPhone>', deliveryOrder.phone ? (deliveryOrder.phone.number || '') : 'None');
			body = body.replace('<dor>', deliveryOrder.dor);
			body = body.replace('<unitno>', deliveryOrder.unitno || '');
			body = body.replace('<unitSize>', deliveryOrder.unitSize || '');
			body = body.replace('<pono>', deliveryOrder.pono || '');
			body = body.replace('<isono>', deliveryOrder.isono || '');
			body = body.replace('<contract>', deliveryOrder.contract || '');
			body = body.replace('<clientName>', deliveryOrder.client.entity.fullName);
			body = body.replace('<clientPhone>', deliveryOrder.client && deliveryOrder.client.branch && deliveryOrder.client.branch.phones && deliveryOrder.client.branch.phones.length > 0 ? deliveryOrder.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', deliveryOrder.client.account.email);
			body = body.replace('<clientAddress>', deliveryOrder.siteAddress.address1 + ', ' + deliveryOrder.siteAddress.city.description + ', ' + deliveryOrder.siteAddress.state.description + ' ' + deliveryOrder.siteAddress.zipcode);
			body = body.replace('<issue>', deliveryOrder.issue || 'None');
			body = body.replace('<comment>', deliveryOrder.comment || 'None');
			var contacts = '';
			for (var i = 0; i < deliveryOrder.contacts.length; i++) {
				if (deliveryOrder.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (deliveryOrder.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (deliveryOrder.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (deliveryOrder.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (deliveryOrder && deliveryOrder.client && deliveryOrder.client.company && deliveryOrder.client.company.entity ? deliveryOrder.client.company.entity.name : 'Not Defined');
			var branch = deliveryOrder && deliveryOrder.client && deliveryOrder.client.branch ? '' + deliveryOrder.client.branch.name : '' + deliveryOrder.client.entity.fullName;
			var subject = 'DELETED - Delivery Order: ' + deliveryOrder.dor + ' | ' + company + ' | ' + branch;

			var deliveryOrderAttachments = [];
			if (deliveryOrder.photos) {
				for (var i = 0; i < deliveryOrder.photos.length; i++) {
					var photoDir = dirname + '/public/app' + deliveryOrder.photos[i].url;
					//console.log(photoDir)
					deliveryOrderAttachments.push({
						filename: deliveryOrder.photos[i].name,
						//content: fs.readFileSync(photoDir),
						contentType: deliveryOrder.photos[i].type,
						path: photoDir
					});
				}
			}
			console.log('sending mail', subject);
			mails = _.uniq(mails);
			sendMail('mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', subject, body, true, deliveryOrderAttachments, null, null, 'mf@mobileonecontainers.com')
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

var sendSetupTearDown = function (SetupTearDown, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/setupteardown.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			console.log(url)
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(SetupTearDown.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', SetupTearDown.createdBy.entity ? SetupTearDown.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', SetupTearDown.client.company ? SetupTearDown.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', SetupTearDown.client.branch ? SetupTearDown.client.branch.name : 'None');
			body = body.replace('<customer>', SetupTearDown.customer || 'None');
			body = body.replace('<customerPhone>', SetupTearDown.phone ? (SetupTearDown.phone.number || '') : 'None');
			body = body.replace('<tor>', SetupTearDown.tor);
			body = body.replace('<serviceType>', SetupTearDown.typeItem.item);
			body = body.replace('<unitno>', SetupTearDown.unitno || '');
			body = body.replace('<unitSize>', SetupTearDown.unitSize || '');
			body = body.replace('<pono>', SetupTearDown.pono || '');
			body = body.replace('<contract>', SetupTearDown.contract || '');
			body = body.replace('<clientName>', SetupTearDown.client.entity.fullName);
			body = body.replace('<clientPhone>', SetupTearDown.client && SetupTearDown.client.branch && SetupTearDown.client.branch.phones && SetupTearDown.client.branch.phones.length > 0 ? SetupTearDown.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', SetupTearDown.client.account.email);
			body = body.replace('<clientAddress>', SetupTearDown.siteAddress.address1 + ', ' + SetupTearDown.siteAddress.city.description + ', ' + SetupTearDown.siteAddress.state.description + ' ' + SetupTearDown.siteAddress.zipcode);
			body = body.replace('<issue>', SetupTearDown.issue || 'None');
			body = body.replace('<comment>', SetupTearDown.comment || 'None');
			var contacts = '';
			for (var i = 0; i < SetupTearDown.contacts.length; i++) {
				if (SetupTearDown.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (SetupTearDown.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (SetupTearDown.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (SetupTearDown.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (SetupTearDown && SetupTearDown.client && SetupTearDown.client.company && SetupTearDown.client.company.entity ? SetupTearDown.client.company.entity.name : 'Not Defined');
			var branch = SetupTearDown && SetupTearDown.client && SetupTearDown.client.branch ? '' + SetupTearDown.client.branch.name : '' + SetupTearDown.client.entity.fullName;
			var subject = 'Set up & Tear Down: ' + SetupTearDown.tor + ' | ' + company + ' | ' + branch;

			var SetupTearDownAttachments = [];
			if (SetupTearDown.photos) {
				for (var i = 0; i < SetupTearDown.photos.length; i++) {
					var photoDir = dirname + '/public/app' + SetupTearDown.photos[i].url;
					//console.log(photoDir)
					SetupTearDownAttachments.push({
						filename: SetupTearDown.photos[i].name,
						//content: fs.readFileSync(photoDir),
						contentType: SetupTearDown.photos[i].type,
						path: photoDir
					});
				}
			}
			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
			sendMail(mails.join(', '), subject, body, true, SetupTearDownAttachments, null, null, 'mf@mobileonecontainers.com')
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

var sendSetupTearDownUpdate = function (SetupTearDown, mails, user) {
	var deferred = q.defer();
	bringTemplateData('/email/templateSetupTearDownUpdate.html')
		.then(function (body) {
			var url = config.SERVER_URL;

			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(SetupTearDown.date).format('MM/DD/YYYY'));
			body = body.replace('<clientCompany>', SetupTearDown.client.company ? SetupTearDown.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', SetupTearDown.client.branch ? SetupTearDown.client.branch.name : 'None');
			body = body.replace('<customer>', SetupTearDown.customer || 'None');
			body = body.replace('<customerPhone>', SetupTearDown.phone ? (SetupTearDown.phone.number || '') : 'None');
			body = body.replace('<tor>', SetupTearDown.tor);
			body = body.replace('<serviceType>', SetupTearDown.typeItem.item);
			body = body.replace('<unitno>', SetupTearDown.unitno || '');
			body = body.replace('<unitSize>', SetupTearDown.unitSize || '');
			body = body.replace('<pono>', SetupTearDown.pono ? (SetupTearDown.pono) : '');
			body = body.replace('<contract>', SetupTearDown.contract || '');
			body = body.replace('<clientName>', SetupTearDown.client.entity.fullName);
			body = body.replace('<clientPhone>', SetupTearDown.client && SetupTearDown.client.branch && SetupTearDown.client.branch.phones && SetupTearDown.client.branch.phones.length > 0 ? SetupTearDown.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', SetupTearDown.client.account.email);
			body = body.replace('<clientAddress>', SetupTearDown.siteAddress.address1 + ', ' + SetupTearDown.siteAddress.city.description + ', ' + SetupTearDown.siteAddress.state.description + ' ' + SetupTearDown.siteAddress.zipcode);
			body = body.replace('<issue>', SetupTearDown.issue || 'None');
			body = body.replace('<comment>', SetupTearDown.comment || 'None');

			var changesByUser = '';
			changesByUser += (user.entity.fullName || user.entity.name) + '<br/> Changes: ';
			var fieldsChanged = '';
			if (SetupTearDown.fieldsChanged) {
				for (var i = 0; i < SetupTearDown.fieldsChanged.length; i++) {
					if (SetupTearDown.fieldsChanged[i].by != user._id)
						continue;
					fieldsChanged += SetupTearDown.fieldsChanged[i].field;
					if (i != SetupTearDown.fieldsChanged.length - 1) {
						fieldsChanged += ', ';
					}
				}
			}
			var addedItems = '';
			if (SetupTearDown.addedItems) {
				for (var i = 0; i < SetupTearDown.addedItems.length; i++) {
					addedItems += SetupTearDown.addedItems[i].description;
					if (i != SetupTearDown.addedItems.length - 1) {
						addedItems += ', ';
					}
				}
			}

			var removedItems = '';
			if (SetupTearDown.removedItems) {
				for (var i = 0; i < SetupTearDown.removedItems.length; i++) {
					removedItems += SetupTearDown.removedItems[i].description;
					if (i != SetupTearDown.removedItems.length - 1) {
						removedItems += ', ';
					}
				}
			}

			changesByUser += fieldsChanged == '' ? 'None' : fieldsChanged;
			changesByUser += addedItems == '' ? '' : '<br/> Added Items: ' + addedItems;
			changesByUser += removedItems == '' ? '' : '<br/> Removed Items: ' + removedItems;

			body = body.replace('<client>', changesByUser);
			var contacts = '';
			for (var i = 0; i < SetupTearDown.contacts.length; i++) {
				if (SetupTearDown.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + SetupTearDown.contacts[i].name + '.&nbsp;<br/><b>Phone(' + SetupTearDown.contacts[i].phoneType.description + '):</b>&nbsp;' + SetupTearDown.contacts[i].number + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');

			var company = '' + (SetupTearDown && SetupTearDown.client && SetupTearDown.client.company && SetupTearDown.client.company.entity ? SetupTearDown.client.company.entity.name : 'Not Defined');
			var branch = SetupTearDown && SetupTearDown.client && SetupTearDown.client.branch ? '' + SetupTearDown.client.branch.name : '' + SetupTearDown.client.entity.fullName;
			var subject = 'Set Up & Tear Down: ' + SetupTearDown.tor + ' | ' + company + ' | ' + branch;

			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
			sendMail(mails.join(', '), subject, body, true, null, null, null, 'mf@mobileonecontainers.com')
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

var sendSetupTearDownDelete = function (SetupTearDown, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/setupteardownDelete.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			console.log(url)
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(SetupTearDown.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', SetupTearDown.createdBy.entity ? SetupTearDown.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', SetupTearDown.client.company ? SetupTearDown.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', SetupTearDown.client.branch ? SetupTearDown.client.branch.name : 'None');
			body = body.replace('<customer>', SetupTearDown.customer || 'None');
			body = body.replace('<customerPhone>', SetupTearDown.phone ? (SetupTearDown.phone.number || '') : 'None');
			body = body.replace('<tor>', SetupTearDown.tor);
			body = body.replace('<unitno>', SetupTearDown.unitno || '');
			body = body.replace('<unitSize>', SetupTearDown.unitSize || '');
			body = body.replace('<pono>', SetupTearDown.pono || '');
			body = body.replace('<contract>', SetupTearDown.contract || '');
			body = body.replace('<clientName>', SetupTearDown.client.entity.fullName);
			body = body.replace('<clientPhone>', SetupTearDown.client && SetupTearDown.client.branch && SetupTearDown.client.branch.phones && SetupTearDown.client.branch.phones.length > 0 ? SetupTearDown.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', SetupTearDown.client.account.email);
			body = body.replace('<clientAddress>', SetupTearDown.siteAddress.address1 + ', ' + SetupTearDown.siteAddress.city.description + ', ' + SetupTearDown.siteAddress.state.description + ' ' + SetupTearDown.siteAddress.zipcode);
			body = body.replace('<issue>', SetupTearDown.issue || 'None');
			body = body.replace('<comment>', SetupTearDown.comment || 'None');
			var contacts = '';
			for (var i = 0; i < SetupTearDown.contacts.length; i++) {
				if (SetupTearDown.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (SetupTearDown.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (SetupTearDown.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (SetupTearDown.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (SetupTearDown && SetupTearDown.client && SetupTearDown.client.company && SetupTearDown.client.company.entity ? SetupTearDown.client.company.entity.name : 'Not Defined');
			var branch = SetupTearDown && SetupTearDown.client && SetupTearDown.client.branch ? '' + SetupTearDown.client.branch.name : '' + SetupTearDown.client.entity.fullName;
			var subject = 'DELETED - Setup & TearDown: ' + SetupTearDown.tor + ' | ' + company + ' | ' + branch;

			var SetupTearDownAttachments = [];
			if (SetupTearDown.photos) {
				for (var i = 0; i < SetupTearDown.photos.length; i++) {
					var photoDir = dirname + '/public/app' + SetupTearDown.photos[i].url;
					//console.log(photoDir)
					SetupTearDownAttachments.push({
						filename: SetupTearDown.photos[i].name,
						//content: fs.readFileSync(photoDir),
						contentType: SetupTearDown.photos[i].type,
						path: photoDir
					});
				}
			}

			mails = _.uniq(mails);
			sendMail('mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', subject, body, true, SetupTearDownAttachments, null, null, 'mf@mobileonecontainers.com')
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

var sendhomeBusiness = function (homeBusiness, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/homeBusiness.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(homeBusiness.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', homeBusiness.createdBy.entity ? homeBusiness.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', homeBusiness.client.company ? homeBusiness.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', homeBusiness.client.branch ? homeBusiness.client.branch.name : 'None');
			body = body.replace('<customer>', homeBusiness.customer || 'None');
			body = body.replace('<customerPhone>', homeBusiness.phone ? (homeBusiness.phone.number || '') : 'None');
			body = body.replace('<hor>', homeBusiness.hor);
			body = body.replace('<acserial>', homeBusiness.acserial || '');
			body = body.replace('<ACtype>', homeBusiness.ACType.item || '');
			body = body.replace('<pono>', homeBusiness.pono || '');
			body = body.replace('<contract>', homeBusiness.contract || '');
			body = body.replace('<clientName>', homeBusiness.client.entity.fullName);
			body = body.replace('<clientPhone>', homeBusiness.client && homeBusiness.client.branch && homeBusiness.client.branch.phones && homeBusiness.client.branch.phones.length > 0 ? homeBusiness.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', homeBusiness.client.account.email);
			body = body.replace('<clientAddress>', homeBusiness.siteAddress.address1 + ', ' + homeBusiness.siteAddress.city.description + ', ' + homeBusiness.siteAddress.state.description + ' ' + homeBusiness.siteAddress.zipcode);
			body = body.replace('<issue>', homeBusiness.issue || 'None');
			body = body.replace('<comment>', homeBusiness.comment || 'None');
			var contacts = '';
			for (var i = 0; i < homeBusiness.contacts.length; i++) {
				if (homeBusiness.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (homeBusiness.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (homeBusiness.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (homeBusiness.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (homeBusiness && homeBusiness.client && homeBusiness.client.company && homeBusiness.client.company.entity ? homeBusiness.client.company.entity.name : 'Not Defined');
			var branch = homeBusiness && homeBusiness.client && homeBusiness.client.branch ? '' + homeBusiness.client.branch.name : '' + homeBusiness.client.entity.fullName;
			var subject = 'Home & Business: ' + homeBusiness.hor + ' | ' + company + ' | ' + branch;

			var homeBusinessAttachments = [];
			if (homeBusiness.photos) {
				for (var i = 0; i < homeBusiness.photos.length; i++) {
					var photoDir = dirname + '/public/app' + homeBusiness.photos[i].url;
					//console.log(photoDir)
					homeBusinessAttachments.push({
						filename: homeBusiness.photos[i].name,
						//content: fs.readFileSync(photoDir),
						contentType: homeBusiness.photos[i].type,
						path: photoDir
					});
				}
			}
			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
			sendMail(mails.join(', '), subject, body, true, homeBusinessAttachments, null, null, 'mf@mobileonecontainers.com')
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

var sendhomeBusinessUpdate = function (homeBusiness, mails, user) {
	var deferred = q.defer();
	bringTemplateData('/email/templatehomeBusinessUpdate.html')
		.then(function (body) {
			var url = config.SERVER_URL;

			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(homeBusiness.date).format('MM/DD/YYYY'));
			body = body.replace('<clientCompany>', homeBusiness.client.company ? homeBusiness.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', homeBusiness.client.branch ? homeBusiness.client.branch.name : 'None');
			body = body.replace('<customer>', homeBusiness.customer || 'None');
			body = body.replace('<customerPhone>', homeBusiness.phone ? (homeBusiness.phone.number || '') : 'None');
			body = body.replace('<hor>', homeBusiness.hor);
			body = body.replace('<acserial>', homeBusiness.acserial || '');
			body = body.replace('<ACtype>', homeBusiness.ACType.item || '');
			body = body.replace('<pono>', homeBusiness.pono || '');
			body = body.replace('<contract>', homeBusiness.contract || '');
			body = body.replace('<clientName>', homeBusiness.client.entity.fullName);
			body = body.replace('<clientPhone>', homeBusiness.client && homeBusiness.client.branch && homeBusiness.client.branch.phones && homeBusiness.client.branch.phones.length > 0 ? homeBusiness.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', homeBusiness.client.account.email);
			body = body.replace('<clientAddress>', homeBusiness.siteAddress.address1 + ', ' + homeBusiness.siteAddress.city.description + ', ' + homeBusiness.siteAddress.state.description + ' ' + homeBusiness.siteAddress.zipcode);
			body = body.replace('<issue>', homeBusiness.issue || 'None');
			body = body.replace('<comment>', homeBusiness.comment || 'None');

			var changesByUser = '';
			changesByUser += (user.entity.fullName || user.entity.name) + '<br/> Changes: ';
			var fieldsChanged = '';
			if (homeBusiness.fieldsChanged) {
				for (var i = 0; i < homeBusiness.fieldsChanged.length; i++) {
					if (homeBusiness.fieldsChanged[i].by != user._id)
						continue;
					fieldsChanged += homeBusiness.fieldsChanged[i].field;
					if (i != homeBusiness.fieldsChanged.length - 1) {
						fieldsChanged += ', ';
					}
				}
			}
			var addedItems = '';
			if (homeBusiness.addedItems) {
				for (var i = 0; i < homeBusiness.addedItems.length; i++) {
					addedItems += homeBusiness.addedItems[i].description;
					if (i != homeBusiness.addedItems.length - 1) {
						addedItems += ', ';
					}
				}
			}

			var removedItems = '';
			if (homeBusiness.removedItems) {
				for (var i = 0; i < homeBusiness.removedItems.length; i++) {
					removedItems += homeBusiness.removedItems[i].description;
					if (i != homeBusiness.removedItems.length - 1) {
						removedItems += ', ';
					}
				}
			}

			changesByUser += fieldsChanged == '' ? 'None' : fieldsChanged;
			changesByUser += addedItems == '' ? '' : '<br/> Added Items: ' + addedItems;
			changesByUser += removedItems == '' ? '' : '<br/> Removed Items: ' + removedItems;
			body = body.replace('<client>', changesByUser);
			var contacts = '';
			for (var i = 0; i < homeBusiness.contacts.length; i++) {
				if (homeBusiness.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + homeBusiness.contacts[i].name + '.&nbsp;<br/><b>Phone(' + homeBusiness.contacts[i].phoneType.description + '):</b>&nbsp;' + homeBusiness.contacts[i].number + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');

			var company = '' + (homeBusiness && homeBusiness.client && homeBusiness.client.company && homeBusiness.client.company.entity ? homeBusiness.client.company.entity.name : 'Not Defined');
			var branch = homeBusiness && homeBusiness.client && homeBusiness.client.branch ? '' + homeBusiness.client.branch.name : '' + homeBusiness.client.entity.fullName;
			var subject = 'Home & Business: ' + homeBusiness.hor + ' | ' + company + ' | ' + branch;

			mails = _.uniq(mails);
			if (mails.indexOf('mf@mobileonecontainers.com') != -1) {
				mails.push("ar@mobileonecontainers.com")
				mails.push("nr@mobileonecontainers.com")
			}
			sendMail(mails.join(', '), subject, body, true, null, null, null, 'mf@mobileonecontainers.com')
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

var sendhomeBusinessDelete = function (homeBusiness, mails, dirname) {
	var deferred = q.defer();
	bringTemplateData('/homeBusinessDelete.html')
		.then(function (body) {
			var url = config.SERVER_URL;
			body = body.replace('<emailUrl>', url);
			body = body.replace('<createdDate>', moment(homeBusiness.date).format('MM/DD/YYYY'));
			body = body.replace('<createdBy>', homeBusiness.createdBy.entity ? homeBusiness.createdBy.entity.fullName : '');
			body = body.replace('<clientCompany>', homeBusiness.client.company ? homeBusiness.client.company.entity.name : 'None');
			body = body.replace('<clientBranch>', homeBusiness.client.branch ? homeBusiness.client.branch.name : 'None');
			body = body.replace('<customer>', homeBusiness.customer || 'None');
			body = body.replace('<customerPhone>', homeBusiness.phone ? (homeBusiness.phone.number || '') : 'None');
			body = body.replace('<hor>', homeBusiness.hor);
			body = body.replace('<acserial>', homeBusiness.acserial || '');
			body = body.replace('<ACtype>', homeBusiness.ACType.item || '');
			body = body.replace('<pono>', homeBusiness.pono || '');
			body = body.replace('<contract>', homeBusiness.contract || '');
			body = body.replace('<clientName>', homeBusiness.client.entity.fullName);
			body = body.replace('<clientPhone>', homeBusiness.client && homeBusiness.client.branch && homeBusiness.client.branch.phones && homeBusiness.client.branch.phones.length > 0 ? homeBusiness.client.branch.phones[0].number : 'None');
			body = body.replace('<clientMail>', homeBusiness.client.account.email);
			body = body.replace('<clientAddress>', homeBusiness.siteAddress.address1 + ', ' + homeBusiness.siteAddress.city.description + ', ' + homeBusiness.siteAddress.state.description + ' ' + homeBusiness.siteAddress.zipcode);
			body = body.replace('<issue>', homeBusiness.issue || 'None');
			body = body.replace('<comment>', homeBusiness.comment || 'None');
			var contacts = '';
			for (var i = 0; i < homeBusiness.contacts.length; i++) {
				if (homeBusiness.contacts[i].name)
					contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (homeBusiness.contacts[i].name || '') + '.&nbsp;<br/><b>Phone(' + (homeBusiness.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (homeBusiness.contacts[i].number || '') + '<br/>';
			}
			body = body.replace('<contacts>', contacts || '');
			var company = '' + (homeBusiness && homeBusiness.client && homeBusiness.client.company && homeBusiness.client.company.entity ? homeBusiness.client.company.entity.name : 'Not Defined');
			var branch = homeBusiness && homeBusiness.client && homeBusiness.client.branch ? '' + homeBusiness.client.branch.name : '' + homeBusiness.client.entity.fullName;
			var subject = 'DELETED - Home & Business: ' + homeBusiness.hor + ' | ' + company + ' | ' + branch;

			var homeBusinessAttachments = [];
			if (homeBusiness.photos) {
				for (var i = 0; i < homeBusiness.photos.length; i++) {
					var photoDir = dirname + '/public/app' + homeBusiness.photos[i].url;
					homeBusinessAttachments.push({
						filename: homeBusiness.photos[i].name,
						contentType: homeBusiness.photos[i].type,
						path: photoDir
					});
				}
			}
			mails = _.uniq(mails);
			sendMail('mf@mobileonecontainers.com, ar@mobileonecontainers.com, nr@mobileonecontainers.com', subject, body, true, homeBusinessAttachments, null, null, 'mf@mobileonecontainers.com')
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

exports.sendInvoice = sendInvoice;
exports.sendInvoiceUpdate = sendInvoiceUpdate;
exports.sendInvoiceDelete = sendInvoiceDelete;
exports.sendServiceOrder = sendServiceOrder;
exports.sendServiceOrderUpdate = sendServiceOrderUpdate;
exports.sendServiceOrderDelete = sendServiceOrderDelete;
exports.sendWorkOrder = sendWorkOrder;
exports.sendWorkOrderUpdate = sendWorkOrderUpdate;
exports.sendWorkOrderDelete = sendWorkOrderDelete;
exports.init = init;
exports.sendMail = sendMail;
exports.sendActivationEmail = sendActivationEmail;
exports.sendForgotPasswordMail = sendForgotPasswordMail;
exports.sendDeliveryOrder = sendDeliveryOrder;
exports.sendDeliveryOrderUpdate = sendDeliveryOrderUpdate;
exports.sendQuotes = sendQuotes
exports.sendDeliveryOrderDelete = sendDeliveryOrderDelete;
exports.sendSetupTearDown = sendSetupTearDown;
exports.sendSetupTearDownUpdate = sendSetupTearDownUpdate;
exports.sendSetupTearDownDelete = sendSetupTearDownDelete;
exports.sendhomeBusiness = sendhomeBusiness
exports.sendhomeBusinessUpdate = sendhomeBusinessUpdate;
exports.sendhomeBusinessDelete = sendhomeBusinessDelete 