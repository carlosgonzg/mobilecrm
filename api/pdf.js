var pdf = require('html-pdf');
var fs =  require('fs');
var moment = require('moment');
var numeral = require('numeral');
var q = require('q');

var createInvoiceBody = function(obj){
	var body = fs.readFileSync(__dirname + '/invoice.html', 'utf8').toString();
	//replacement of data
	body = body.replace('<createdDate>', moment(obj.date).format('MM/DD/YYYY'));
	body = body.replace('<invoiceNumber>', obj.invoiceNumber);
	body = body.replace('<clientName>', obj.client.entity.fullName);
	body = body.replace('<clientAddress>', obj.siteAddress.address1);
	body = body.replace('<clientState>', obj.siteAddress.state.description + ' ' + obj.siteAddress.zipcode);
	body = body.replace('<clientPhone>', obj.phone.number);
	body = body.replace('<clientMail>', obj.client.account.email);
	body = body.replace('<comment>', obj.comment);
	body = body.replace('<pono>', obj.pono);
	body = body.replace('<unitno>', obj.unitno);
	body = body.replace('<isono>', obj.isono);
	body = body.replace('<clientCity>', obj.siteAddress.city.description);
	body = body.replace('<sor>', obj.sor);
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

var createInvoice = function(obj){
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
	var body = createInvoiceBody(obj);
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

exports.createInvoice = createInvoice;