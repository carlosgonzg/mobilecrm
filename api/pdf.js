var pdf = require('html-pdf');
var fs =  require('fs');
var moment = require('moment');
var numeral = require('numeral');
var q = require('q');

var createInvoiceBody = function(obj, company, branch){
	var body = fs.readFileSync(__dirname + '/invoice.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment(obj.date).format('MM/DD/YYYY'));
	body = body.replace(/<invoiceNumber>/g, obj.invoiceNumber);
	//Company
	body = body.replace(/<companyName>/g, company.entity.name);
	body = body.replace(/<companyAddress>/g, company.address.address1);
	body = body.replace(/<companyState>/g, company.address.state.description + ' ' + company.address.zipcode);
	//Cliente
	body = body.replace(/<clientName>/g, obj.client.entity.fullName);
	body = body.replace(/<clientAddress>/g, obj.siteAddress.address1);
	body = body.replace(/<clientState>/g, obj.siteAddress.state.description + ' ' + obj.siteAddress.zipcode);
	body = body.replace(/<clientPhone>/g, obj.phone.number);
	body = body.replace(/<clientMail>/g, obj.client.account.email);
	body = body.replace(/<comment>/g, obj.comment);
	body = body.replace(/<pono>/g, obj.pono);
	body = body.replace(/<unitno>/g, obj.unitno);
	body = body.replace(/<isono>/g, obj.isono);
	body = body.replace(/<clientCity>/g, obj.siteAddress.city.description);
	body = body.replace(/<sor>/g, obj.sor);
	//Inserting table of items
	var total = 0;
	var tableItems = '';
	for(var i = 0; i < obj.items.length; i++){
		var item = obj.items[i];
		tableItems += '<tr>';
		tableItems += '<td style="text-align: center;border: thin solid black; border-top: none; border-right: none;">';
		//tableItems += item.code || '';
		tableItems += '</td>';
		tableItems += '<td colspan="4" style="border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.description || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.part || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += numeral(item.price).format('$0,0.00');
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.quantity;
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';
		tableItems += numeral(item.price * item.quantity).format('$0,0.00');
		tableItems += '</td>';
		total += item.price * item.quantity;
		tableItems += '</tr>';
	}
	
	body = body.replace('<tableItems>', tableItems);

	body = body.replace('<subtotal>', numeral(total).format('$0,0.00'));
	body = body.replace('<total>', numeral(total).format('$0,0.00'));
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
		}
	};
	var body = createInvoiceBody(obj, company, branch);
	pdf.create(body, options).toFile(__dirname + '/invoices/' + obj.invoiceNumber + '.pdf', function(err, res) {
        if (err) {
            d.reject(err)
            console.log(err);
            return 
        }
        else {
          d.resolve({ path: __dirname + '/invoices/' + obj.invoiceNumber + '.pdf', fileName:  obj.invoiceNumber + '.pdf' });
        }
	});
    return d.promise;
};

var createServiceOrderBody = function(serviceOrder){
	console.log(__dirname);
	var body = fs.readFileSync(__dirname + '/serviceorder.html', 'utf8').toString();
	//replacement of data
	body = body.replace('<createdDate>', moment(serviceOrder.date).format('MM/DD/YYYY'));
	body = body.replace('<clientCompany>', serviceOrder.client.company ? serviceOrder.client.company.entity.name : 'None');
	body = body.replace('<clientBranch>', serviceOrder.client.branch ? serviceOrder.client.branch.name : 'None');
	body = body.replace('<customer>', serviceOrder.customer || 'None');
	body = body.replace('<customerPhone>', serviceOrder.phone ? serviceOrder.phone.number : 'None');
	body = body.replace('<sor>', serviceOrder.sor);
	body = body.replace('<unitno>', serviceOrder.unitno);
	body = body.replace('<pono>', serviceOrder.pono);
	body = body.replace('<isono>', serviceOrder.isono);
	body = body.replace('<clientName>', serviceOrder.client.entity.fullName);
	body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
	body = body.replace('<clientMail>', serviceOrder.client.account.email);
	body = body.replace('<clientAddress>', serviceOrder.siteAddress.address1 + ', ' + serviceOrder.siteAddress.city.description + ', ' + serviceOrder.siteAddress.state.description + ' ' + serviceOrder.siteAddress.zipcode);
	body = body.replace('<issue>', serviceOrder.issue || 'None');
	body = body.replace('<comment>', serviceOrder.comment || 'None');
	var contacts = '';
	for(var i = 0; i < serviceOrder.contacts.length; i++){
		contacts += '<b>Contact #' + (i+1) + ':&nbsp;</b>' +  serviceOrder.contacts[i].name + '.&nbsp;<b>Phone(' + serviceOrder.contacts[i].phoneType.description + '):</b>&nbsp;' + serviceOrder.contacts[i].number + '<br/>';
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
		}
	};
	var body = createServiceOrderBody(obj);
	pdf.create(body, options).toFile(__dirname + '/serviceorders/' + obj.invoiceNumber + '.pdf', function(err, res) {
        if (err) {
            d.reject(err)
            console.log(err);
            return 
        }
        else {
          d.resolve({ path: __dirname + '/serviceorders/' + obj.invoiceNumber + '.pdf', fileName:  obj.invoiceNumber + '.pdf' });
        }
	});
    return d.promise;
};


exports.createInvoice = createInvoice;
exports.createServiceOrder = createServiceOrder;



