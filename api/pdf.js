var pdf = require('html-pdf');
var fs =  require('fs');
var moment = require('moment');
var numeral = require('numeral');
var q = require('q');
var _ = require('underscore');

var getPaid = function(invoices, year, month){
	return _.reduce(invoices, function(memo, value){
		return memo + (year == value.year && month == value.month && value.status._id == 4 ? value.total : 0);
	}, 0);
};
var getPendingPay = function(invoices, year, month){
	return _.reduce(invoices, function(memo, value){
		return memo + (year == value.year && month == value.month && value.status._id != 4 ? value.total : 0);
	}, 0);
};
var getPending = function(invoices, year, month){
	return _.reduce(invoices, function(memo, value){
		return memo + (year == value.year && month == value.month && value.status._id ==  1 ? value.total : 0);
	}, 0);
};
var getTotal = function(invoices, year, month){
	return _.reduce(invoices, function(memo, value){
		return memo + (year == value.year && month == value.month ? value.total : 0);
	}, 0);
};

var createInvoiceBody = function(obj, company, branch){
	var body = fs.readFileSync(__dirname + '/invoice.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment(obj.date).format('MM/DD/YYYY'));
	body = body.replace(/<dueDate>/g, moment(obj.date).add(30,'days').format('MM/DD/YYYY'));
	body = body.replace(/<invoiceNumber>/g, obj.invoiceNumber || '');
	//Company

	body = body.replace(/<companyName>/g, company.entity.name || '');
	body = body.replace(/<companyAddress>/g, company.address.address1 || '');
	body = body.replace(/<companyState>/g, (company.address.state.description ? (company.address.state.description + ' ' + company.address.zipcode) || '' : '')) ;
	//Cliente
	body = body.replace(/<clientName>/g, obj.client.entity.fullName || '');
	// body = body.replace(/<clientAddress>/g, obj.sor ? obj.siteAddress.address1 : company.address.address1 || '');
	body = body.replace(/<clientAddress>/g, obj.sor ? obj.siteAddress.address1 :  obj.client.branch.addresses.length > 0 ? obj.client.branch.addresses[0].address1 :  company.address.address1 || '');
	// body = body.replace(/<clientState>/g, obj.sor ? (obj.siteAddress.state.description + ' ' + obj.siteAddress.zipcode || '') : (company.address.state.description + ' ' + company.address.zipcode || ''));
	
	body = body.replace(/<clientState>/g, obj.sor ? (obj.siteAddress.city.description + ', ' + obj.siteAddress.state.id + ', ' + obj.siteAddress.zipcode || '') : obj.client.branch.addresses.length > 0 ? obj.client.branch.addresses[0].city.description + ', ' +obj.client.branch.addresses[0].state.id + ', ' + obj.client.branch.addresses[0].zipcode : (company.address.city.description + ', ' +company.address.state.id + ', ' + company.address.zipcode || ''));
	body = body.replace(/<clientPhone>/g, obj.phone.number || '');
	body = body.replace(/<clientMail>/g, obj.client.account.email || '');
	body = body.replace(/<comment>/g, obj.comment || '');
	body = body.replace(/<pono>/g, obj.pono || '');
	body = body.replace(/<unitno>/g, obj.unitno || '');
	body = body.replace(/<isono>/g, obj.isono || '');
	body = body.replace(/<clientCity>/g, obj.client && obj.client.branch ? (obj.client.branch.name || '') : '');
	body = body.replace(/<labelDocument>/g, obj.sor ? 'SOR:' : (obj.wor ? 'WOR:' : ''));
	body = body.replace(/<sor>/g, obj.sor ? obj.sor : obj.wor ? obj.wor : '');
	//Inserting table of items
	var total = 0;
	var tableItems = '';
	for(var i = 0; i < obj.items.length; i++){
		var item = obj.items[i];
		tableItems += '<tr>';
		tableItems += '<td style="text-align: center;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.code || '';
		tableItems += '</td>';
		tableItems += '<td colspan="4" style="border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.description || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.part || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += numeral(item.price || 0).format('$0,0.00');
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.quantity || 1;
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';
		tableItems += numeral((item.price || 0) * (item.quantity || 1)).format('$0,0.00');
		tableItems += '</td>';
		total += (item.price || 0) * (item.quantity || 1);
		tableItems += '</tr>';
	}
	body = body.replace('<tableItems>', tableItems || '');
	total = total || 0;
	var taxes = (company.taxes || 0);
	body = body.replace('<subtotal>', numeral(total).format('$0,0.00'));
	if (obj.client.hideDueDates) {
		body = body.replace('<showTable>', '<div style="display:none">');
	} else {
		body = body.replace('<showTable>', '<div>');
	}

	body = body.replace('<date15>', moment(obj.date,'MM/DD/YYYY').add(45,'days').format('MM/DD/YYYY'));
	body = body.replace('<date30>', moment(obj.date,'MM/DD/YYYY').add(60,'days').format('MM/DD/YYYY'));
	body = body.replace('<date60>', moment(obj.date,'MM/DD/YYYY').add(90,'days').format('MM/DD/YYYY'));
	
	body = body.replace('<taxesPorcentage>', taxes*100 || 0);
	body = body.replace('<taxes>', numeral(total * taxes).format('$0,0.00'));
	body = body.replace('<total>', numeral(total + (total * taxes)).format('$0,0.00'));
	body = body.replace('<total15>', numeral((total + (total * taxes)) * 1.05).format('$0,0.00'));
	body = body.replace('<total30>', numeral((total + (total * taxes)) * 1.10).format('$0,0.00'));
	body = body.replace('<total60>', numeral((total + (total * taxes)) * 1.15).format('$0,0.00'));
	return body;
};

var createInvoice = function(obj, company, branch){
    var d = q.defer();
	var options = { 
		format: 'Letter',
		border: {
			top: '0.5in',
			right: '0.5in',
			bottom: '0.5in',
			left: '0.5in'
		},
		timeout: 60000
	};
	var fileName = obj.invoiceNumber + '.pdf';
	var url = __dirname + '/invoices/' + fileName;
	var body = createInvoiceBody(obj, company, branch);
	pdf.create(body, options).toFile(url, function(err, res) {
        if (err) {
        	console.log(err);
            d.reject(err)
        }
        else {
          d.resolve({ path: url, fileName:  fileName });
        }
	});
    return d.promise;
};

var createServiceOrderBody = function(serviceOrder){
	var body = fs.readFileSync(__dirname + '/serviceorder.html', 'utf8').toString();
	//replacement of data
	body = body.replace('<createdDate>', moment(serviceOrder.date).format('MM/DD/YYYY'));
	body = body.replace('<clientCompany>', serviceOrder.client.company ? (serviceOrder.client.company.entity.name || '') : 'None');
	body = body.replace('<clientBranch>', serviceOrder.client.branch ? (serviceOrder.client.branch.name || '') : 'None');
	body = body.replace('<customer>', serviceOrder.customer || 'None');
	body = body.replace('<customerPhone>', serviceOrder.phone ? (serviceOrder.phone.number || '') : 'None');
	body = body.replace('<sor>', serviceOrder.sor || '');
	body = body.replace('<unitno>', serviceOrder.unitno || '');
	body = body.replace('<pono>', serviceOrder.pono || '');
	body = body.replace('<isono>', serviceOrder.isono || '');
	body = body.replace('<clientName>', serviceOrder.client.entity.fullName || '');
	body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
	body = body.replace('<clientMail>', serviceOrder.client.account.email || '');
	body = body.replace('<clientAddress>', (serviceOrder.siteAddress.address1 || '') + ', ' + (serviceOrder.siteAddress.city.description || '') + ', ' + (serviceOrder.siteAddress.state.description || '') + ' ' + (serviceOrder.siteAddress.zipcode || ''));
	body = body.replace('<issue>', serviceOrder.issue || 'None');
	body = body.replace('<comment>', serviceOrder.comment || 'None');
	var contacts = '';
	for(var i = 0; i < serviceOrder.contacts.length; i++){
		if(serviceOrder.contacts[i].name)
			contacts += '<b>Contact #' + (i+1) + ':&nbsp;</b>' +  (serviceOrder.contacts[i].name || '') + '.&nbsp;<b>Phone(' + (serviceOrder.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (serviceOrder.contacts[i].number || '') + '<br/>';
	}
	body = body.replace('<contacts>', contacts || '');
	return body;
};

var createServiceOrder = function(obj){
    var d = q.defer();
	var options = { 
		format: 'Letter',
		border: {
			top: '0.5in',
			right: '0.5in',
			bottom: '0.5in',
			left: '0.5in'
		},
		timeout: 60000
	};
	var body = createServiceOrderBody(obj);
	var fileName = obj.sor + '.pdf';
	var url = __dirname + '/serviceorders/' + fileName;
	console.log(url)
	pdf.create(body, options).toFile(url, function(err, res) {
		console.log(err, res)
        if (err) {
            console.log(err);
            d.reject(err); 
        }
        else {
          d.resolve({ path: url, fileName:  fileName });
        }
	});
    return d.promise;
};

var createWorkOrderBody = function(workOrder, company, showPrice){
	var body = fs.readFileSync(__dirname + '/workorder.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment(workOrder.date).format('MM/DD/YYYY'));
	body = body.replace(/<wor>/g, workOrder.wor || '');

	//Company
	body = body.replace(/<companyName>/g, company.entity.name || '');
	body = body.replace(/<companyAddress>/g, company.address.address1 || '');
	body = body.replace(/<companyState>/g, company.address.state.description ? (company.address.state.description || '') + ' ' + (company.address.zipcode || '') : '');

	//Cliente
	body = body.replace(/<clientName>/g, workOrder.client.entity.fullName || '');
	body = body.replace(/<clientAddress>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].address1 :  company.address.address1 || '');
	body = body.replace(/<clientState>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].city.description + ', ' +workOrder.client.branch.addresses[0].state.id + ', ' + workOrder.client.branch.addresses[0].zipcode : (company.address.state.description || '') + ' ' + (company.address.zipcode || ''));
	body = body.replace(/<clientMail>/g, workOrder.client.account.email || '');

	body = body.replace(/<comment>/g, workOrder.comment || '');
	body = body.replace(/<pono>/g, workOrder.pono || '');
	body = body.replace(/<unitno>/g, workOrder.unitno || '');
	body = body.replace(/<isono>/g, workOrder.isono || '');
	body = body.replace(/<clientCity>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].city.description : company.address.city.description || '');

	//Inserting table of items
	var total = 0;
	var tableItems = '';
	for(var i = 0; i < workOrder.items.length; i++){
		var item = workOrder.items[i];
		tableItems += '<tr>';
		tableItems += '<td style="text-align: center;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.code || '';
		tableItems += '</td>';
		tableItems += '<td colspan="4" style="border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.description || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.part || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		if(showPrice)
			tableItems += numeral(item.price || 0).format('$0,0.00');
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		if(showPrice)
			tableItems += item.quantity || 1;
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';
		if(showPrice)
			tableItems += numeral((item.price || 0) * (item.quantity || 1)).format('$0,0.00');
		tableItems += '</td>';
		total += (item.price || 0) * (item.quantity || 1);
		tableItems += '</tr>';
	}
	body = body.replace('<tableItems>', tableItems || '');
	if(showPrice){
		body = body.replace('<subtotal>', numeral(total).format('$0,0.00'));
		body = body.replace('<total>', numeral(total).format('$0,0.00'));
	}
	return body;
};

var createWorkOrder = function(obj, company, showPrice){
    var d = q.defer();
	var options = { 
		format: 'Letter',
		border: {
			top: '0.5in',
			right: '0.5in',
			bottom: '0.5in',
			left: '0.5in'
		},
		timeout: 60000
	};
	var body = createWorkOrderBody(obj, company, showPrice || false);
	var fileName = obj.wor + '.pdf';
	var url = __dirname + '/workorders/' + fileName;
	console.log(url)
	pdf.create(body, options).toFile(url, function(err, res) {
		console.log(err, res)
        if (err) {
        	console.log(err);
            d.reject(err)
        }
        else {
          d.resolve({ path: url, fileName:  fileName });
        }
	});
    return d.promise;
};

var createMonthlyStatementBody = function(invoices, whoIs){
	var body = fs.readFileSync(__dirname + '/monthlystatement.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment().format('MM/DD/YYYY'));
	body = body.replace(/<whoIs>/g, whoIs.name);
	//Inserting table of items
	var tableMSItems = '';
	var tableDItems = '';
	var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var today = new Date();
	for(var i = 1; i <= 12; i++){
		tableMSItems += '<tr>';
		tableMSItems += '<td style="text-align: center;border: thin solid black; border-top: none; border-right: none;">';
		tableMSItems +=  today.getFullYear();
		tableMSItems += '</td>';
		tableMSItems += '<td style="border: thin solid black; border-top: none; border-right: none;">';
		tableMSItems += months[i];
		tableMSItems += '</td>';
		tableMSItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableMSItems += numeral(getPaid(invoices, today.getFullYear(), i)).format('$0,0.00');
		tableMSItems += '</td>';
		tableMSItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableMSItems += numeral(getPendingPay(invoices, today.getFullYear(), i)).format('$0,0.00');
		tableMSItems += '</td>';
		/*
		tableMSItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableMSItems += numeral(getPending(invoices, today.getFullYear(), i)).format('$0,0.00');
		tableMSItems += '</td>'; */
		tableMSItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';
		tableMSItems += numeral(getTotal(invoices, today.getFullYear(), i)).format('$0,0.00');
		tableMSItems += '</td>';
		tableMSItems += '</tr>';
	}
	body = body.replace('<tableMSItems>', tableMSItems);
	for(var i = 0; i < invoices.length; i++){
		tableDItems += '<tr>';
		tableDItems += '<td colspan="11" style="border-bottom: solid 1px #333333"><b>';
		tableDItems +=   invoices[i].month + ' - ' + invoices[i].year + '(' + invoices[i].status.description + ')';
		tableDItems += '</b></td>';
		tableDItems += '<tr>';	
		for(var j = 0; j < invoices[i].invoices.length; j++){
			var invoice = invoices[i].invoices[j];
			tableDItems += '<tr>';
			tableDItems += '<td>';
			tableDItems +=  invoice.client.name;
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems +=  moment(invoice.date).format('MM/DD/YYYY');
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.invoiceNumber;
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.unitno;
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.pono;
			tableDItems += '</td>';
			tableDItems += '<td style="text-align: right;">';
			tableDItems += numeral(invoice.total).format('$0,0.00');
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.status.description;
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.year;
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.month;
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.branch ? invoice.branch.name : '';
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += invoice.company ? invoice.company.name : '';
			tableDItems += '</td>';
			tableDItems += '</tr>';
		}
	}
	body = body.replace('<tableDItems>', tableDItems);
	return body;
};

var createMonthlyStatement = function(invoices, whoIs){
    var d = q.defer();
	var options = { 
		format: 'Letter',
		border: {
			top: '0.5in',
			right: '0.5in',
			bottom: '0.5in',
			left: '0.5in'
		}
	};
	var body = createMonthlyStatementBody(invoices, whoIs);
	var fname = moment().format('MM-DD-YYYY hh:mm') + '.pdf';
	var relPath = '/monthlystatement/ms-' + fname;
	pdf.create(body, options).toFile(__dirname + '/monthlystatement/' + fname, function(err, res) {
        if (err) {
            d.reject(err)
            console.log(err);
            return 
        }
        else {
          d.resolve({ path: __dirname + '/monthlystatement/' + fname, fileName: fname});
        }
	});
    return d.promise;
};

exports.createInvoice = createInvoice;
exports.createServiceOrder = createServiceOrder;
exports.createWorkOrder = createWorkOrder;
exports.createMonthlyStatement = createMonthlyStatement;


