var pdf = require('html-pdf');
var fs = require('fs');
var moment = require('moment');
var numeral = require('numeral');
var q = require('q');
var _ = require('underscore');

var getPaid = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month && value.status._id == 4 ? value.total : 0);
	}, 0);
};
var getPendingPay = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month && value.status._id != 4 ? value.total : 0);
	}, 0);
};
var getPending = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month && value.status._id == 1 ? value.total : 0);
	}, 0);
};
var getTotal = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month ? value.total : 0);
	}, 0);
};

var createInvoiceBody = function (obj, company, branch) {
	var body = fs.readFileSync(__dirname + '/invoice.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment(obj.date).format('MM/DD/YYYY'));
	body = body.replace(/<dueDate>/g, moment(obj.date).add(30, 'days').format('MM/DD/YYYY'));
	body = body.replace(/<invoiceNumber>/g, obj.invoiceNumber || '');
	//Company

	body = body.replace(/<companyName>/g, company.entity.name || '');

	if (company._id == 21) {
		var addressWilliams = ""

		if (branch._id == 31) {  //SI ES ORLANDO
			addressWilliams = "Attn: Branch 12140"
		}
		if (branch._id == 32) { //SI ES FORT. LAUDERDALE
			addressWilliams = "Attn: Branch 12110"
		}
		body = body.replace(/<companyAddress>/g, addressWilliams + '<br />P.O. Box 17552<br />Baltimore, MD 21297-1552');
	} else {
		body = body.replace(/<companyAddress>/g, company.address.address1 || '');
	}

	body = body.replace(/<companyState>/g, (company.address.state.description ? (company.address.state.description + ' ' + company.address.zipcode) || '' : ''));
	//Cliente
	body = body.replace(/<clientName>/g, obj.client.entity.fullName || '');

	var projectDesc = ""
	var dorDesc = "";
	// body = body.replace(/<clientState>/g, obj.sor ? (obj.siteAddress.state.description + ' ' + obj.siteAddress.zipcode || '') : (company.address.state.description + ' ' + company.address.zipcode || ''));
	if (obj.dor) {

		var addressfrom = "From Address : " + obj.siteAddressFrom.address1 + ', ' + obj.siteAddressFrom.city.description + ', ' + obj.siteAddressFrom.city.stateId + ', ' + obj.siteAddressFrom.country.description
		var addressto = "<br /><br />To Address : " + obj.siteAddress.address1 + ', ' + obj.siteAddress.city.description + ', ' + obj.siteAddress.city.stateId + ', ' + obj.siteAddress.country.description
		var AddRoute = ""

		if (obj.additionalRoute && obj.additionalRoute.waypts) {
			var additionalrouteStart = obj.additionalRoute ? (obj.additionalRoute.Start ? 'Additional Route <br /><br />Start : ' + obj.additionalRoute.Start : "") : ""
			var additionalRouteEnd = obj.additionalRoute ? (obj.additionalRoute.End ? 'End : ' + obj.additionalRoute.End : "") : ""
			var waypts = ""

			for (let I = 0; I < obj.additionalRoute.waypts.length; I++) {
				var N = I + 1;
				const element = obj.additionalRoute.waypts[I];
				waypts += 'Way Points # ' + N + ' - ' + element.location + ' <br /><br />'
			}
			AddRoute = addressto + '<br /><br />' + additionalrouteStart + ' <br /><br />' + waypts + " " + additionalRouteEnd
		} else {
			AddRoute = addressto
		}

		body = body.replace(/<clientAddress>/g, addressfrom.replace(/, , /g, ""));
		body = body.replace(/<clientState>/g, AddRoute.replace(/, , /g, ""));

		if (obj.ServiceType && (obj.ServiceType.item == "Pickup" || obj.ServiceType.item == "Delivery")) {
			projectDesc = obj.ServiceType.item
			if (obj.Relocation) {
				projectDesc = projectDesc + " and Relocation "
			}
		} else if (obj.ServiceType == "Relocation") {
			projectDesc = "Relocation "
		}

	} else {
		var addressFrom = obj.sor ? obj.siteAddress.address1 : obj.client.branch.addresses.length > 0 ? obj.client.branch.addresses[0].address1 : company.address.address1 || ''
		var addressTo = obj.sor ? (obj.siteAddress.city.description + ', ' + obj.siteAddress.state.id + ', ' + obj.siteAddress.zipcode || '') : obj.client.branch.addresses.length > 0 ? obj.client.branch.addresses[0].city.description + ', ' + obj.client.branch.addresses[0].state.id + ', ' + obj.client.branch.addresses[0].zipcode : (company.address.city.description + ', ' + company.address.state.id + ', ' + company.address.zipcode || '')

		addressFrom = addressFrom.replace("undefined", "")
		addressTo = addressTo.replace("undefined", "")

		body = body.replace(/<clientAddress>/g, addressFrom ? "ADDRESS: " + addressFrom : "");
		body = body.replace(/<clientState>/g, addressTo);
	}

	body = body.replace(/<clientPhone>/g, obj.phone.number || '');
	body = body.replace(/<clientMail>/g, obj.client.account.email || '');

	if (projectDesc != "") {
		body = body.replace(/<comment>/g, (obj.comment || '') + ' ' + projectDesc);
	} else {
		body = body.replace(/<comment>/g, obj.comment || '');
	}

	body = body.replace(/<pono>/g, obj.pono || '');
	body = body.replace(/<unitno>/g, obj.unitno || '');
	body = body.replace(/<isono>/g, obj.isono || '');
	body = body.replace(/<clientCity>/g, obj.client && obj.client.branch ? (obj.client.branch.name || '') : '');
	body = body.replace(/<labelDocument>/g, obj.sor ? 'SOR:' : (obj.wor ? 'WOR:' : obj.dor ? 'Delivery Order #:' : ''));
	body = body.replace(/<sor>/g, obj.sor ? obj.sor : obj.wor ? obj.wor : obj.dor ? obj.dor : '');
	//Inserting table of items
	var total = 0;
	var tableItems = '';
	for (var i = 0; i < obj.items.length; i++) {
		var item = obj.items[i];
		var priceUnit = 0;
		var quantity = 0;
		var miles = false;

		if (obj.dor && item._id == 805) {
			if (company.perHours && company.perHours == true) {
				quantity = (item.quantity || 1)
			} else {
				quantity = 1;
				miles = true
			}
			var res = getTotalDelivery(company, obj.items, obj.typeTruck)
			priceUnit = res[0];
			dorDesc = res[1];
		} else {
			priceUnit = item.price
			quantity = item.quantity || 1;
		}

		if (miles == false) { //SI EL CALCULO ES NORMAL Ej... CANTIDAD * PRECIO = TOTAL
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

			if (obj.dor && company.perHours && company.perHours == true) {
				var costPerHours = 0;
				if (obj.typeTruck._id == 1) {
					costPerHours = company.costPerHours;
				} else {
					costPerHours = company.smallTruck;
				}
				tableItems += numeral(costPerHours || 0).format('$0,0.00');
			} else {
				tableItems += numeral(priceUnit || 0).format('$0,0.00');
			}

			tableItems += '</td>';
			tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
			tableItems += quantity;
			tableItems += '</td>';
			tableItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';

			if (obj.dor) {
				tableItems += numeral(priceUnit || 1).format('$0,0.00');
			} else {
				tableItems += numeral((item.price || 0) * (item.quantity || 1)).format('$0,0.00');
				total += (item.price || 0) * (item.quantity || 1);
			}
			tableItems += '</td>';
			tableItems += '</tr>';
		} else if (miles == true && obj.dor) { //SI EL CALCULO ES APLICANDOLE LA FORMULA DE DELIVERY
			var DefaultMiles = dorDesc.split(";")[1];
			var miles = dorDesc.split(";")[0];
			var calcMiles = 0;
			var totalAdditional = 0;

			if (numeral(miles) > numeral(DefaultMiles)) {
				calcMiles = miles - DefaultMiles
				totalAdditional = numeral((dorDesc.split(";")[0] - dorDesc.split(";")[1]) * (dorDesc.split(";")[3]).replace("$", "")).format('$0,0.00');
			}

			var dataRow = [
				{ description: "1st " + dorDesc.split(";")[1] + " mile charge", coste: dorDesc.split(";")[2], qty: 1, total: dorDesc.split(";")[2] },
				{ description: "Additional Miles", coste: dorDesc.split(";")[3], qty: calcMiles, total: totalAdditional }]

			for (let row = 0; row < dataRow.length; row++) {
				tableItems += '<tr>';
				tableItems += '<td style="text-align: center;border: thin solid black; border-top: none; border-right: none;">';
				tableItems += '';
				tableItems += '</td>';
				tableItems += '<td colspan="4" style="border: thin solid black; border-top: none; border-right: none;">';
				tableItems += dataRow[row].description || '';
				tableItems += '</td>';
				tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
				tableItems += item.part || '';
				tableItems += '</td>';
				tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
				tableItems += numeral(dataRow[row].coste || 0).format('$0,0.00');
				tableItems += '</td>';
				tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
				tableItems += (dataRow[row].qty || 0);
				tableItems += '</td>';
				tableItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';
				tableItems += numeral(dataRow[row].total || 0).format('$0,0.00');
				tableItems += '</td>';
				tableItems += '</tr>';
			}
		}
	}

	body = body.replace('<tableItems>', tableItems || '');

	if (obj.dor) {
		total = obj.total;
	}

	total = total || 0;
	var taxes = (company.taxes || 0);
	body = body.replace('<subtotal>', numeral(total).format('$0,0.00'));
	if (obj.client.hideDueDates) {
		body = body.replace('<showTable>', '<div style="display:none">');
	} else {
		body = body.replace('<showTable>', '<div>');
	}

	body = body.replace('<date15>', moment(obj.date, 'MM/DD/YYYY').add(45, 'days').format('MM/DD/YYYY'));
	body = body.replace('<date30>', moment(obj.date, 'MM/DD/YYYY').add(60, 'days').format('MM/DD/YYYY'));
	body = body.replace('<date60>', moment(obj.date, 'MM/DD/YYYY').add(90, 'days').format('MM/DD/YYYY'));

	body = body.replace('<taxesPorcentage>', Math.round(taxes * 100) || 0);
	body = body.replace('<taxes>', numeral(total * taxes).format('$0,0.00'));
	body = body.replace('<total>', numeral(total + (total * taxes)).format('$0,0.00'));
	body = body.replace('<total15>', numeral((total + (total * taxes)) * 1.05).format('$0,0.00'));
	body = body.replace('<total30>', numeral((total + (total * taxes)) * 1.10).format('$0,0.00'));
	body = body.replace('<total60>', numeral((total + (total * taxes)) * 1.15).format('$0,0.00'));
	return body;
};

var createInvoice = function (obj, company, branch, urlPdfQuote) {
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

	var fileName = ""
	var url = ""
	var body = "";

	if (obj.quotes == 1 && (obj.invoiceNumber || '') == 'Pending Invoice') {
		url = urlPdfQuote
		body = createQuotesBody(obj, company, branch);
	} else {
		fileName = obj.invoiceNumber + '.pdf';
		url = __dirname + '/invoices/' + fileName;
		body = createInvoiceBody(obj, company, branch);
	}

	pdf.create(body, options).toFile(url, function (err, res) {
		if (err) {
			console.log(err);
			d.reject(err)
		}
		else {
			d.resolve({ path: url, fileName: fileName });
		}
	});
	return d.promise;
};


var createServiceOrderBody = function (serviceOrder) {
	var body = fs.readFileSync(__dirname + '/serviceorder.html', 'utf8').toString();
	//replacement of data
	body = body.replace('<createdDate>', moment(serviceOrder.date).format('MM/DD/YYYY'));
	body = body.replace('<clientCompany>', serviceOrder.client.company ? (serviceOrder.client.company.entity.name || '') : 'None');
	body = body.replace('<clientBranch>', serviceOrder.client.branch ? (serviceOrder.client.branch.name || '') : 'None');
	body = body.replace('<customer>', serviceOrder.customer || 'None');
	body = body.replace('<customerPhone>', serviceOrder.phone ? (serviceOrder.phone.number || '') : 'None');
	body = body.replace('<sor>', serviceOrder.sor || '');
	body = body.replace('<unitno>', serviceOrder.unitno || '');
	body = body.replace('<pono>', serviceOrder.pono || '');
	body = body.replace('<isono>', serviceOrder.isono || '');
	body = body.replace('<clientName>', serviceOrder.client.entity.fullName || '');
	body = body.replace('<clientPhone>', serviceOrder.client && serviceOrder.client.branch && serviceOrder.client.branch.phones && serviceOrder.client.branch.phones.length > 0 ? serviceOrder.client.branch.phones[0].number : 'None');
	body = body.replace('<clientMail>', serviceOrder.client.account.email || '');
	body = body.replace('<clientAddress>', (serviceOrder.siteAddress.address1 || '') + ', ' + (serviceOrder.siteAddress.city.description || '') + ', ' + (serviceOrder.siteAddress.state.description || '') + ' ' + (serviceOrder.siteAddress.zipcode || ''));
	body = body.replace('<issue>', serviceOrder.issue || 'None');
	body = body.replace('<comment>', serviceOrder.comment || 'None');
	var contacts = '';
	for (var i = 0; i < serviceOrder.contacts.length; i++) {
		if (serviceOrder.contacts[i].name)
			contacts += '<b>Contact #' + (i + 1) + ':&nbsp;</b>' + (serviceOrder.contacts[i].name || '') + '.&nbsp;<b>Phone(' + (serviceOrder.contacts[i].phoneType.description || '') + '):</b>&nbsp;' + (serviceOrder.contacts[i].number || '') + '<br/>';
	}
	body = body.replace('<contacts>', contacts || '');
	return body;
};

var createServiceOrder = function (obj) {
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
	pdf.create(body, options).toFile(url, function (err, res) {
		console.log(err, res)
		if (err) {
			console.log(err);
			d.reject(err);
		}
		else {
			d.resolve({ path: url, fileName: fileName });
		}
	});
	return d.promise;
};

var createWorkOrderBody = function (workOrder, company, showPrice) {
	var body = fs.readFileSync(__dirname + '/workorder.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment(workOrder.date).format('MM/DD/YYYY'));
	body = body.replace(/<wor>/g, workOrder.wor || '');

	//Company
	body = body.replace(/<companyName>/g, company.entity.name || '');
	body = body.replace(/<companyAddress>/g, company.address.address1 || '');
	body = body.replace(/<companyState>/g, company.address.state.description ? (company.address.state.description || '') + ' ' + (company.address.zipcode || '') : '');

	//Cliente
	body = body.replace(/<clientName>/g, workOrder.client.entity.fullName || '');
	body = body.replace(/<clientAddress>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].address1 : company.address.address1 || '');
	body = body.replace(/<clientState>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].city.description + ', ' + workOrder.client.branch.addresses[0].state.id + ', ' + workOrder.client.branch.addresses[0].zipcode : (company.address.state.description || '') + ' ' + (company.address.zipcode || ''));
	body = body.replace(/<clientMail>/g, workOrder.client.account.email || '');

	body = body.replace(/<comment>/g, workOrder.comment || '');
	body = body.replace(/<pono>/g, workOrder.pono || '');
	body = body.replace(/<unitno>/g, workOrder.unitno || '');
	body = body.replace(/<isono>/g, workOrder.isono || '');
	body = body.replace(/<clientCity>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].city.description : company.address.city.description || '');

	//Inserting table of items
	var total = 0;
	var tableItems = '';
	for (var i = 0; i < workOrder.items.length; i++) {
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
		if (showPrice)
			tableItems += numeral(item.price || 0).format('$0,0.00');
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		if (showPrice)
			tableItems += item.quantity || 1;
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';
		if (showPrice)
			tableItems += numeral((item.price || 0) * (item.quantity || 1)).format('$0,0.00');
		tableItems += '</td>';
		total += (item.price || 0) * (item.quantity || 1);
		tableItems += '</tr>';
	}
	body = body.replace('<tableItems>', tableItems || '');
	if (showPrice) {
		body = body.replace('<subtotal>', numeral(total).format('$0,0.00'));
		body = body.replace('<total>', numeral(total).format('$0,0.00'));
	}
	return body;
};

var createWorkOrder = function (obj, company, showPrice, crewdata) {
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
	pdf.create(body, options).toFile(url, function (err, res) {
		console.log(err, res)
		if (err) {
			console.log(err);
			d.reject(err)
		}
		else {
			d.resolve({ path: url, fileName: fileName });
		}
	});
	return d.promise;
};

var createMonthlyStatementBody = function (invoices, whoIs) {
	var body = fs.readFileSync(__dirname + '/monthlystatement.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment().format('MM/DD/YYYY'));
	body = body.replace(/<whoIs>/g, whoIs.name);
	//Inserting table of items
	var tableMSItems = '';
	var tableDItems = '';
	var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var today = new Date();
	for (var i = 1; i <= 12; i++) {
		tableMSItems += '<tr>';
		tableMSItems += '<td style="text-align: center;border: thin solid black; border-top: none; border-right: none;">';
		tableMSItems += today.getFullYear();
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
	for (var i = 0; i < invoices.length; i++) {
		tableDItems += '<tr>';
		tableDItems += '<td colspan="11" style="border-bottom: solid 1px #333333"><b>';
		tableDItems += invoices[i].month + ' - ' + invoices[i].year + '(' + invoices[i].status.description + ')';
		tableDItems += '</b></td>';
		tableDItems += '<tr>';
		for (var j = 0; j < invoices[i].invoices.length; j++) {
			var invoice = invoices[i].invoices[j];
			tableDItems += '<tr>';
			tableDItems += '<td>';
			tableDItems += invoice.client.name;
			tableDItems += '</td>';
			tableDItems += '<td>';
			tableDItems += moment(invoice.date).format('MM/DD/YYYY');
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

var createMonthlyStatement = function (invoices, whoIs) {
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
	pdf.create(body, options).toFile(__dirname + '/monthlystatement/' + fname, function (err, res) {
		if (err) {
			d.reject(err)
			console.log(err);
			return
		}
		else {
			d.resolve({ path: __dirname + '/monthlystatement/' + fname, fileName: fname });
		}
	});
	return d.promise;
};


//CODIGO PARA GENERAR LAS ORDENES DE TRABAJO DE LOS TECNICOS 

var createWorkOrderCrew = function (obj, company, crewdata) {
	let CrewDefinition = {
		data: [
			{
				id: 'int',
				name: "string",
				fileName: 'string',
				url: 'string',
				email: 'string',
				techid: 'int',
				labor: [{
					description: 'string',
					code: 'string',
					part: 'string',
					price: 'int',
					quantity: 'int'
				}]
			}
		]
	};

	for (var i = 0; i < crewdata.items.length; i++) {
		var element = crewdata.items[i];

		if (element.crewLeaderCol != null) {
			var iduser = element.crewLeaderCol.id;
			var CrewName = element.crewLeaderCol.name;
			var description = element.description;
			var code = element.code;
			var part = element.part;
			var price = element.crewLeaderCol.price;
			var quantity = element.quantity;
			var techid = element.crewLeaderCol.techId;

			if (i == 0) {
				CrewDefinition = {
					data: [
						{
							id: iduser,
							name: CrewName,
							techid: techid,
							labor: [{
								description: description,
								code: code,
								part: part,
								price: price,
								quantity: quantity
							}]
						}
					]
				};
			} else {
				AddCrewDescription(CrewDefinition, CrewName, iduser, description, code, part, price, quantity, techid)
			}
		}
	}
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

	for (var i = 0; i < CrewDefinition.data.length; i++) {
		var today = new Date();
		var date = moment(today).format('-MM-DD-YYYY-HHmmss');

		var d = q.defer();
		var body = createWorkOrderBodyCrew(obj, company, CrewDefinition.data[i]);
		var fileName = CrewDefinition.data[i].name + date + '.pdf';
		var url = __dirname + '/workorders/' + fileName;

		CrewDefinition.data[i].fileName = fileName
		CrewDefinition.data[i].url = url

		pdf.create(body, options).toFile(url, function (err, res) {
			if (err) {
				d.reject(err)
			}
			else {
				d.resolve({ CrewDefinition });
			}
		});
	}
	return d.promise;
};

function AddCrewDescription(CrewDefinition, CrewName, iduser, description, code, part, price, quantity, techid) {
	var existsName = false;
	for (var row = 0; row < CrewDefinition.data.length; row++) {
		var RowName = CrewDefinition.data[row].name;
		if (RowName == CrewName) {
			CrewDefinition.data[row].labor.push(
				{
					id: iduser,
					description: description,
					code: code,
					part: part,
					price: price,
					quantity: quantity

				}
			)
			return false;
		}
	}

	if (existsName == false) {
		CrewDefinition.data.push(
			{
				id: iduser,
				name: CrewName,
				techid: techid,
				labor: [{
					description: description,
					code: code,
					part: part,
					price: price,
					quantity: quantity
				}]
			}
		)
	}

	return false;
}

var createWorkOrderBodyCrew = function (workOrder, company, Crewdata) {
	var body = fs.readFileSync(__dirname + '/workorder.html', 'utf8').toString();

	body = body.replace('none', 'block');

	//replacement of data
	body = body.replace(/<createdDate>/g, moment(workOrder.date).format('MM/DD/YYYY'));
	body = body.replace(/<wor>/g, workOrder.wor || '');

	//Company
	body = body.replace(/<companyName>/g, company.entity.name || '');
	body = body.replace(/<companyAddress>/g, company.address.address1 || '');
	body = body.replace(/<companyState>/g, company.address.state.description ? (company.address.state.description || '') + ' ' + (company.address.zipcode || '') : '');

	//INVOICE
	body = body.replace(/CUSTOMER/g, 'COMPANY');
	body = body.replace("techname**", Crewdata.name || '');
	body = body.replace("techinvoice**", workOrder.invoiceNumber + ' - ' + Crewdata.techid || '');
	body = body.replace(/PO#/g, 'Customer');
	body = body.replace(/Contract #/g, '');
	body = body.replace(/Part/g, '');

	//Cliente
	body = body.replace(/<clientName>/g, workOrder.client.entity.fullName || '');
	body = body.replace(/<clientAddress>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].address1 : company.address.address1 || '');
	body = body.replace(/<clientState>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].city.description + ', ' + workOrder.client.branch.addresses[0].state.id + ', ' + workOrder.client.branch.addresses[0].zipcode : (company.address.state.description || '') + ' ' + (company.address.zipcode || ''));
	body = body.replace(/<clientMail>/g, workOrder.client.account.email || '');

	body = body.replace(/<comment>/g, workOrder.comment || '');
	body = body.replace(/<pono>/g, workOrder.client.entity.fullName || '');
	body = body.replace(/<unitno>/g, workOrder.unitno || '');
	//body = body.replace(/<isono>/g, workOrder.isono || '');
	body = body.replace(/<clientCity>/g, workOrder.client.branch.addresses.length > 0 ? workOrder.client.branch.addresses[0].city.description : company.address.city.description || '');

	//Inserting table of items
	var total = 0;
	var tableItems = '';
	for (var i = 0; i < Crewdata.labor.length; i++) {
		var item = Crewdata.labor[i];
		tableItems += '<tr>';
		tableItems += '<td style="text-align: center;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.code || '';
		tableItems += '</td>';
		tableItems += '<td colspan="4" style="border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.description || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		//tableItems += item.part || '';
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += numeral(item.price || 0).format('$0,0.00');
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none; border-right: none;">';
		tableItems += item.quantity || 1;
		tableItems += '</td>';
		tableItems += '<td style="text-align: right;border: thin solid black; border-top: none;">';
		tableItems += numeral((item.price || 0) * (item.quantity || 1)).format('$0,0.00');
		tableItems += '</td>';
		total += (item.price || 0) * (item.quantity || 1);
		tableItems += '</tr>';
	}
	body = body.replace('<tableItems>', tableItems || '');
	body = body.replace('<subtotal>', numeral(total).format('$0,0.00'));
	body = body.replace('<total>', numeral(total).format('$0,0.00'));

	return body;
};

var createQuotesBody = function (obj, company, branch) {
	var body = fs.readFileSync(__dirname + '/quotes.html', 'utf8').toString();
	//replacement of data
	body = body.replace(/<createdDate>/g, moment(obj.date).format('MM/DD/YYYY'));
	body = body.replace(/<dueDate>/g, moment(obj.date).add(30, 'days').format('MM/DD/YYYY'));
	body = body.replace(/<quotesNumber>/g, obj.quotesNumber || '');
	//Company

	body = body.replace(/{logoUrl}/g, 'file:///' + __dirname + '/quotes/mobileone.png' || '');
	body = body.replace(/<companyName>/g, company.entity.name || '');
	body = body.replace(/<companyAddress>/g, company.address.address1 || '');
	body = body.replace(/<companyState>/g, (company.address.state.description ? (company.address.state.description + ' ' + company.address.zipcode) || '' : ''));
	//Cliente
	body = body.replace(/<clientName>/g, obj.client.entity.fullName || '');
	body = body.replace(/<clientPhone>/g, obj.phone.number || '');
	body = body.replace(/<clientMail>/g, obj.client.account.email || '');
	body = body.replace(/<comment>/g, obj.comment || '');
	body = body.replace(/<clientCity>/g, obj.client && obj.client.branch ? (obj.client.branch.name || '') : '');
	body = body.replace(/<labelDocument>/g, obj.serviceType.description);

	if (obj.serviceType._id == 4) {
		body = body.replace(/<serialno>/g, obj.acserial || '');
		body = body.replace(/<serialnoText>/g, 'AC Serial #');
	} else {
		body = body.replace(/<serialno>/g, obj.unitno || '');
		body = body.replace(/<serialnoText>/g, 'Serial #');
	}


	//Inserting table of items
	var total = 0;
	var tableItems = '';
	for (var i = 0; i < obj.items.length; i++) {
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
		if (obj.dor) {
			tableItems += numeral(item.price || 1).format('$0,0.00');
		} else {
			tableItems += numeral((item.price || 0) * (item.quantity || 1)).format('$0,0.00');
		}
		tableItems += '</td>';
		total += (item.price || 0) * (item.quantity || 1);
		tableItems += '</tr>';
	}
	body = body.replace('<tableItems>', tableItems || '');

	total = obj.total || 0;
	var taxes = (obj.taxes || 0);

	body = body.replace('<subtotal>', numeral(total).format('$0,0.00'));
	if (obj.client.hideDueDates) {
		body = body.replace('<showTable>', '<div style="display:none">');
	} else {
		body = body.replace('<showTable>', '<div>');
	}
	total = ((total * taxes) / 100) + total

	body = body.replace('<date15>', moment(obj.date, 'MM/DD/YYYY').add(45, 'days').format('MM/DD/YYYY'));
	body = body.replace('<date30>', moment(obj.date, 'MM/DD/YYYY').add(60, 'days').format('MM/DD/YYYY'));
	body = body.replace('<date60>', moment(obj.date, 'MM/DD/YYYY').add(90, 'days').format('MM/DD/YYYY'));

	body = body.replace('<taxesPorcentage>', Math.round(taxes) || 0);
	body = body.replace('<taxes>', numeral(((obj.total * taxes) / 100)).format('$0,0.00'));
	body = body.replace('<total>', numeral(total).format('$0,0.00'))
	body = body.replace('<total15>', numeral(total * 1.05).format('$0,0.00'))
	body = body.replace('<total30>', numeral(total * 1.10).format('$0,0.00'));
	body = body.replace('<total60>', numeral(total * 1.15).format('$0,0.00'));
	return body;
};


var getTotalDelivery = function (comp, items, typeTruck) {
	var total = 0;
	//sumo el total
	var InitPrice = 0;
	var initialMile = 30;
	var costPerMile = 3.25;
	var costPerHours = 0;
	var dorDesc = "";

	for (var index = 0; index < items.length; index++) {
		InitPrice = items[index].price;

		if (comp == undefined) { //SI NO TIENE LA CONFIGURACION
			var miles = (items[index].quantity || 1);;

			if (items[index]._id == 805) {
				if (miles > 30) {
					total += (miles - initialMile) * costPerMile + (items[index].price)
					dorDesc = miles + ";" + 30 + ";" + items[index].price + ";$3.25";
				} else {
					total += items[index].price
					dorDesc = miles + ";" + 30 + ";" + items[index].price + ";$3.25";
				}
			} else {
				total += (items[index].price * (miles || 1));
			}
		}
		if (items[index]._id == 806 || items[index]._id == 805) {
			if (comp.perHours != undefined) {
				if (comp.perHours == false && comp.initialCost != undefined) {
					InitPrice = comp.initialCost;
					initialMile = comp.initialMile;
					costPerMile = comp.costPerMile;
				} else {
					if (typeTruck._id == 1) {
						costPerHours = comp.costPerHours;
					} else {
						costPerHours = comp.smallTruck;
					}
				}
			}
		}
		if (items[index]._id == 805 && costPerHours == 0) {
			if (items[index].quantity <= initialMile) {
				total += InitPrice;
				items[index].price = InitPrice;
				dorDesc = items[index].quantity + ";" + initialMile + ";" + InitPrice + ";$" + costPerMile
			} else {
				var minMiles = initialMile;
				var miles = items[index].quantity;
				var cosTotalmiles = (miles - minMiles) * costPerMile + (InitPrice)

				dorDesc = miles + ";" + minMiles + ";" + InitPrice + ";$" + costPerMile

				total += cosTotalmiles
				items[index].price = cosTotalmiles

				if (items[index].price == 0) {
					var RInitPrice = Math.round(InitPrice * 100) / 100
					items[index].price = RInitPrice
				}
			}
		} else if (items[index]._id == 806 && costPerHours > 0) {
			total += (costPerHours * (items[index].quantity || 1));
		} else {
			total += (items[index].price * (items[index].quantity || 1));
		}
	}
	return [total, dorDesc]
};

exports.createInvoice = createInvoice;
exports.createServiceOrder = createServiceOrder;
exports.createWorkOrder = createWorkOrder;
exports.createWorkOrderCrew = createWorkOrderCrew;
exports.createMonthlyStatement = createMonthlyStatement;

