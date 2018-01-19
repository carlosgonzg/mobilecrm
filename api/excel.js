var Excel = require('./dto/excel');
var q = require('q');
var moment = require('moment');
var _ = require('underscore');
var crud = require('./dto/crud')

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

var getPaidByBranches = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month && value.status._id == 4 ? value.total : 0);
	}, 0);
};
var getPendingPayByBranches = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month && value.status._id == 3 ? value.total : 0);
	}, 0);
};
var getPendingByBranches = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month && value.status._id == 1 ? value.total : 0);
	}, 0);
};
var getTotalByBranches = function (invoices, year, month) {
	return _.reduce(invoices, function (memo, value) {
		return memo + (year == value.year && month == value.month ? value.total : 0);
	}, 0);
};

var createMonthlyStatement = function (data, whoIs, user) {

	var invoices = data.data;
	var branchList = data.branches;
	var companyList = data.companies;
	var companies = [];
	var branches = [];

	for (var i = 0; i < 25; i++) {
		if (branchList[i]) {
			branches.push(branchList[i])
		}
	}
	for (var j = 0; j < 25; j++) {
		if (companyList[j]) {
			companies.push(companyList[j])
		}
	}
	console.log(branchList)
	console.log(companyList)
	var d = q.defer();
	var excel = new Excel('Monthly Statement', null, 'Monthly Statement');
	//fonts
	var headerFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 28,
		bold: true
	};
	var subHeaderFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 14,
		bold: true
	};
	var titleFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 26,
		bold: false
	};
	var normalFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 11,
		bold: false
	};
	var boldFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 11,
		bold: true
	};
	var underlineFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 11,
		bold: true,
		underline: true
	};
	var reportBgColor = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: 'FFFFFFFF' }
	};
	var labelBgColor = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "CCB680" }
	}

	var border  =  {
		top:  { style: 'thin' },
		left:  { style: 'thin' },
		bottom:  { style: 'thin' },
		right:  { style: 'thin' }
	};
	var center = {
		vertical: 'middle',
		horizontal: 'center'
	}
	//setting columns
	excel.worksheet.columns = [
		{ key: 'a', width: 18 },
		{ key: 'b', width: 18 },
		{ key: 'c', width: 18 },
		{ key: 'd', width: 18 },
		{ key: 'e', width: 18 }
	];
	//creating detail sheet		
	excel.worksheetDetail = excel.workbook.addWorksheet('Detail');
	excel.worksheetDetail.columns = [
		{ key: 'a', width: 18 },
		{ key: 'b', width: 18 },
		{ key: 'c', width: 18 },
		{ key: 'd', width: 18 },
		{ key: 'e', width: 18 },
		{ key: 'f', width: 18 },
		{ key: 'g', width: 18 },
		{ key: 'h', width: 18 },
		{ key: 'i', width: 18 },
		{ key: 'j', width: 18 },
		{ key: 'k', width: 18 }
	];

	if (branches.length > 0) {
		//creating detail sheet		
		excel.worksheetByBranches = excel.workbook.addWorksheet('By Branches');
		excel.worksheetByBranches.columns = [
			{ key: 'a', width: 18 },
			{ key: 'b', width: 18 },
			{ key: 'c', width: 18 },
			{ key: 'd', width: 18 },
			{ key: 'e', width: 18 }
		];

	}
	if (companies.length > 0) {
		//creating detail sheet		
		excel.worksheetByBranches = excel.workbook.addWorksheet('By Company');
		excel.worksheetByBranches.columns = [
			{ key: 'a', width: 18 },
			{ key: 'b', width: 18 },
			{ key: 'c', width: 18 },
			{ key: 'd', width: 18 },
			{ key: 'e', width: 18 }
		];

	}
	//header
	excel.worksheet.addRow(['Service Provider', '', '', 'Customer', '', '']);
	// excel.worksheet.mergeCells('A1:B1');
	// excel.worksheet.mergeCells('C1:E1');
	excel.worksheet.lastRow.font = boldFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.getCell('A1').fill = labelBgColor;
	excel.worksheet.getCell('D1').fill = labelBgColor;
	excel.worksheet.mergeCells('A1:B1');
	excel.worksheet.mergeCells('D1:F1');
	excel.worksheet.getCell('A1').border = border;
	excel.worksheet.getCell('D1').border = border;


	excel.worksheet.addRow(['MOBILE ONE', '', '', whoIs.name, '', '']);
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.getCell('A2').font = headerFont;
	excel.worksheet.getCell('D2').font = subHeaderFont;
	excel.worksheet.mergeCells('A2:B2');
	excel.worksheet.mergeCells('D2:F2');
	//sub header
	excel.worksheet.addRow(['Restoration LLC', '', '', whoIs.address ? whoIs.address.address1 : '', '', '']);
	excel.worksheet.lastRow.font = normalFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.getCell('A3').font = subHeaderFont;
	excel.worksheet.mergeCells('A3:B3');
	excel.worksheet.mergeCells('D3:F3');

	excel.worksheet.addRow(['1702 Bridgets Ct', '', '', (whoIs.address ? whoIs.address.state.description : '') + ' ' + (whoIs.address ? whoIs.address.zipcode : ''), '', '']);
	excel.worksheet.lastRow.font = normalFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.mergeCells('A4:B4');
	excel.worksheet.mergeCells('D4:F4');

	excel.worksheet.addRow(['Kissimmee FL 34744', '', '', '', '', '']);
	excel.worksheet.lastRow.font = normalFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.mergeCells('A5:B5');
	excel.worksheet.mergeCells('D5:F5');

	excel.worksheet.addRow(['Phone: (407) 334-8802', '', '', '', '', '']);
	excel.worksheet.lastRow.font = normalFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.mergeCells('A6:B6');
	excel.worksheet.mergeCells('D6:F6');

	//space!
	excel.worksheet.addRow(['', '', '', '', '', '']);
	excel.worksheet.mergeCells('A7:F7');
	excel.worksheet.lastRow.fill = reportBgColor;

	excel.worksheet.addRow(['MONTHLY STATEMENT', '', '', '', '', '']);
	excel.worksheet.lastRow.font = titleFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.mergeCells('A8:F8');
	excel.worksheet.getCell('A8').alignment = center;

	excel.worksheet.addRow(['By Period: ', '', '', '', '', '']);
	excel.worksheet.getCell('A9').font = boldFont;
	excel.worksheet.lastRow.fill = reportBgColor;

	excel.worksheet.addRow(['', '', '', '', '', '']);
	excel.worksheet.lastRow.fill = reportBgColor;
	//table header
	excel.worksheet.addRow(['Year', 'Month', 'Paid', 'Pending to Pay', /*'Pending',*/ 'Total', '']);
	excel.worksheet.lastRow.font = underlineFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.lastRow.alignment = center;
	//info
	var today = new Date();
	var totalPaid = 0;
	var totalPending = 0;
	var totalYear = 0;
	var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	for (var i = 1; i <= 12; i++) {
		monthPaid = 0;
		monthPending = 0;
		monthTotal = 0;
		monthPaid = getPaid(invoices, today.getFullYear(), i);
		monthPending = getPendingPay(invoices, today.getFullYear(), i)/*, getPending(invoices, today.getFullYear(), i)*/;
		monthTotal = getTotal(invoices, today.getFullYear(), i);
		excel.worksheet.addRow([today.getFullYear(), months[i], monthPaid, monthPending, monthTotal, '']);
		excel.worksheet.getCell('C' + (i + 11).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('D' + (i + 11).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('E' + (i + 11).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('A' + (i + 11)).font = boldFont;
		excel.worksheet.getCell('B' + (i + 11)).font = boldFont;
		excel.worksheet.getCell('A' + (i + 11)).alignment = center;
		excel.worksheet.getCell('B' + (i + 11)).alignment = center;
		excel.worksheet.lastRow.fill = reportBgColor;
		//excel.worksheet.getCell('F' + (i + 4).toString()).numFmt = '$ #,###,###,##0.00';
		totalPaid += monthPaid;
		totalPending += monthPending;
		totalYear += monthTotal;
	}

	excel.worksheet.addRow(['Total', '', totalPaid, totalPending, totalYear, '']);
	excel.worksheet.getCell('C' + (13 + 11).toString()).numFmt = '$ #,###,###,##0.00';
	excel.worksheet.getCell('D' + (13 + 11).toString()).numFmt = '$ #,###,###,##0.00';
	excel.worksheet.getCell('E' + (13 + 11).toString()).numFmt = '$ #,###,###,##0.00';
	excel.worksheet.getCell('E' + (13 + 11).toString()).numFmt = '$ #,###,###,##0.00';
	excel.worksheet.getCell('A' + (13 + 11)).font = boldFont;
	excel.worksheet.getCell('B' + (13 + 11)).font = boldFont;
	excel.worksheet.getCell('A' + (13 + 11)).alignment = center;
	excel.worksheet.getCell('B' + (13 + 11)).alignment = center;
	excel.worksheet.lastRow.fill = reportBgColor;
	//by Branches
	//table header

	if (branches.length > 0) {
		excel.worksheet.addRow(['', '', '', '', '', '']);
		excel.worksheet.addRow(['By Branch: ', '', '', '', '', '']);
		excel.worksheet.getCell('A26').font = boldFont;
		excel.worksheet.lastRow.fill = reportBgColor;

		excel.worksheet.addRow(['', 'Branch', 'Paid', 'Pending to Pay', 'Total']);
		excel.worksheet.lastRow.font = underlineFont;
		excel.worksheet.lastRow.fill = reportBgColor;
		excel.worksheet.lastRow.alignment = center;

		var today = new Date();
		var totalPaid = 0;
		var totalPending = 0;
		var totalYear = 0;
		for (var i = 0; i < branches.length; i++) {
			excel.worksheet.addRow(['', branches[i].name, branches[i].paid, branches[i].pending, branches[i].total]);
			excel.worksheet.getCell('C' + (i + 28).toString()).numFmt = '$ #,###,###,##0.00';
			excel.worksheet.getCell('D' + (i + 28).toString()).numFmt = '$ #,###,###,##0.00';
			excel.worksheet.getCell('E' + (i + 28).toString()).numFmt = '$ #,###,###,##0.00';
			excel.worksheet.lastRow.fill = reportBgColor;
			//excel.worksheet.getCell('F' + (i + 4).toString()).numFmt = '$ #,###,###,##0.00';
			totalPaid += branches[i].paid;
			totalPending += branches[i].pending;
			totalYear += branches[i].total;
		}

		excel.worksheet.addRow(['', 'Total', totalPaid, totalPending, totalYear, '']);
		excel.worksheet.getCell('C' + (branches.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('D' + (branches.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('E' + (branches.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('E' + (branches.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('B' + (branches.length + 28)).font = boldFont;
		excel.worksheet.lastRow.fill = reportBgColor;
	}

	if (companies.length > 0) {
		excel.worksheet.addRow(['', '', '', '', '', '']);
		excel.worksheet.addRow(['By Company: ', '', '', '', '', '']);
		excel.worksheet.getCell('A26').font = boldFont;
		excel.worksheet.lastRow.fill = reportBgColor;

		excel.worksheet.addRow(['', 'Company', 'Paid', 'Pending to Pay', 'Total']);
		excel.worksheet.lastRow.font = underlineFont;
		excel.worksheet.lastRow.fill = reportBgColor;
		excel.worksheet.lastRow.alignment = center;

		var today = new Date();
		var totalPaid = 0;
		var totalPending = 0;
		var totalYear = 0;
		for (var i = 0; i < companies.length; i++) {
			excel.worksheet.addRow(['', companies[i].name, companies[i].paid, companies[i].pending, companies[i].total]);
			excel.worksheet.getCell('C' + (i + 28).toString()).numFmt = '$ #,###,###,##0.00';
			excel.worksheet.getCell('D' + (i + 28).toString()).numFmt = '$ #,###,###,##0.00';
			excel.worksheet.getCell('E' + (i + 28).toString()).numFmt = '$ #,###,###,##0.00';
			excel.worksheet.lastRow.fill = reportBgColor;
			//excel.worksheet.getCell('F' + (i + 4).toString()).numFmt = '$ #,###,###,##0.00';
			totalPaid += companies[i].paid;
			totalPending += companies[i].pending;
			totalYear += companies[i].total;
		}

		excel.worksheet.addRow(['', 'Total', totalPaid, totalPending, totalYear, '']);
		excel.worksheet.getCell('C' + (companies.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('D' + (companies.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('E' + (companies.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('E' + (companies.length + 28).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('B' + (companies.length + 28)).font = boldFont;
		excel.worksheet.lastRow.fill = reportBgColor;
	}
	// var detailFields = ['Date', 'Customer', 'Invoice Number', 'Unit Number', 'PO Number', 'Amount', 'Status', 'Year', 'Month', 'Branch', 'Company'];
	var detailFields = ['Date', 'Unit Number', 'PO Number', 'Invoice #', 'Amount', 'Status', 'Year', 'Month', 'Branch', 'Company', 'Origin'];

	excel.worksheetDetail.addRow(detailFields);
	excel.worksheetDetail.lastRow.font = boldFont;
	excel.worksheetDetail.lastRow.fill = reportBgColor;
	//detail

	for (var i = 0; i < detailFields.length; i++) {
		excel.worksheetDetail.getCell(1, i + 1).border = border;
		excel.worksheetDetail.getCell(1, i + 1).fill = labelBgColor;
	};
	//first of all i'm showing the month/year
	for (var i = 0; i < invoices.length; i++) {
		// excel.worksheetDetail.addRow([invoices[i].month + ' - ' + invoices[i].year + '(' + invoices[i].status.description + ')', '', '', '', '', '', '', '', '', '', '']);
		// excel.worksheetDetail.lastRow.font = boldFont;
		// excel.worksheetDetail.lastRow.fill = reportBgColor;
		for (var j = 0; j < invoices[i].invoices.length; j++) {
			var invoice = invoices[i].invoices[j];
			excel.worksheetDetail.addRow([moment(invoice.date).format('MM/DD/YYYY'), invoice.unitno, invoice.pono, invoice.invoiceNumber, invoice.total, invoice.status.description, invoice.year, invoice.month, invoice.branch ? invoice.branch.name : '', invoice.company ? invoice.company.name : '', invoice.sor ? 'S' : 'W']);
			excel.worksheetDetail.lastRow.font = normalFont;
		}
		// for (var j=0;j<invoices.length;j++) {
		// 	excel.worksheet.getCell(i+1,j+1).border = border;
		// }
	}
	//saving file
	var relPath = '/monthystatement/ms-' + moment().format('MM-DD-YYYY hh:mm') + '.xlsx';
	var filePath = __dirname + relPath;
	excel.workbook.xlsx.writeFile(filePath)
		.then(function () {
			d.resolve({ path: filePath });
		});
	return d.promise;
};

var createReport = function (objs, whoIs, query, queryDescription, user) {
	var d = q.defer();
	var excel = new Excel(whoIs + ' Report', null, whoIs + 'Report');
	//fonts
	var headerFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 22,
		bold: true
	};
	var subHeaderFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 18,
		bold: true
	};
	var normalFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 12,
		bold: false
	};
	var boldFont = {
		name: "Calibri (Body)",
		family: 4,
		size: 12,
		bold: true
	};
	var reportBgColor = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: 'FFFFFFFF' }
	};

	var labelBgColor = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "CCB680" }
	}

	var border  =  {
		top:  { style: 'thin' },
		left:  { style: 'thin' },
		bottom:  { style: 'thin' },
		right:  { style: 'thin' }
	};
	//setting columns
	excel.worksheet.columns = [
		{ key: 'a', width: 27 },
		{ key: 'b', width: 27 },
		{ key: 'c', width: 27 },
		{ key: 'd', width: 27 },
		{ key: 'e', width: 27 },
		{ key: 'f', width: 27 },
		{ key: 'g', width: 27 },
		{ key: 'h', width: 27 },
		{ key: 'i', width: 27 },
		{ key: 'j', width: 27 },
		{ key: 'k', width: 27 },
		{ key: 'l', width: 27 }
	];
	//header

	if (queryDescription.status === 'Completed (Pending to Pay)') {
		queryDescription.status = 'Pending to Pay';
	}

	if (queryDescription.status === 'Completed (Paid)') {
		queryDescription.status = 'Paid';
	}


	excel.worksheet.addRow([((queryDescription.status ? queryDescription.status + ' ' : '') + (queryDescription.po ? 'With PO Number ' : '') + (queryDescription.pendingPo ? 'Without PO Number ' : '') + (queryDescription.expenses ? 'Expenses ' : '') + 'REPORT - MOBILE ONE Restoration LLC (UPDATED)').toUpperCase(), '', '', '', '', '', '', '', '', '', moment().format('MM/DD/YYYY')]);
	excel.worksheet.mergeCells('A1:K1');
	excel.worksheet.lastRow.font = headerFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	// sub header
	excel.worksheet.addRow([((queryDescription.company || '') + ' ' + (queryDescription.branch || '')).toUpperCase(), '', '', '', '', '', '', '', '', '', '']);
	excel.worksheet.mergeCells('A2:B2');
	excel.worksheet.mergeCells('C2:J2');
	excel.worksheet.lastRow.font = subHeaderFont;
	excel.worksheet.lastRow.fill = reportBgColor;
	//space!
	excel.worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '']);
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '']);
	excel.worksheet.lastRow.fill = reportBgColor;
	excel.worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '']);
	excel.worksheet.lastRow.fill = reportBgColor;

	//table header
	var fieldsArray = [];

	if (whoIs != "Invoice") {
		if (whoIs == "ServiceOrder") {
			fieldsArray = ['Created Date', 'Company', 'Branch', 'Customer', 'Service Order #', 'Unit #', 'Invoice #', 'PO #', 'Total Amount', 'Reference Branch', 'Tech Asign', 'Status'];
		} else {
			fieldsArray = ['Created Date', 'Unit Number', 'PO Number', (whoIs == 'ServiceOrder' ? 'Service' : (whoIs == 'WorkOrder' ? 'Work' : 'Delivery')) + ' Order #', 'Invoice', 'Total Amount', 'Branch', 'Status', 'Year', 'Month'];
		}

	} else {
		if (queryDescription.expenses) {
			fieldsArray = ['Created Date', 'Unit Number', 'PO Number', 'Invoice', 'Total Amount', 'Expenses', 'Profit', 'Service Order #', 'Work Order #', 'Delivery Order #', 'Branch', 'Status', 'Year', 'Month'];
		} else {
			fieldsArray = ['Created Date', 'Unit Number', 'PO Number', 'Invoice', 'Total Amount', 'Service Order #', 'Work Order #', 'Delivery Order #', 'Branch', 'Status', 'Year', 'Month'];
		}
	}

	excel.worksheet.addRow(fieldsArray);
	excel.worksheet.lastRow.font = boldFont;
	// excel.worksheet.lastRow.border = border;

	for (var i = 0; i < fieldsArray.length; i++) {
		excel.worksheet.getCell(6, i + 1).border = border;
		excel.worksheet.getCell(6, i + 1).fill = labelBgColor;
	}

	//Now the data
	var total = 0;
	var totalProfit = 0;
	var totalExpenses = 0;
	for (var i = 0; i < objs.length; i++) {
		var obj = objs[i];
		var subTotal = 0;
		/* 		for(var j = 0; j < obj.items.length; j++){
					subTotal += obj.items[j].price * obj.items[j].quantity;
				}
				total += subTotal; */

		var InitPrice = 0;
		var initialMile = 30;
		var costPerMile = 3.25;
		var costPerHours = 0;
		var comp = obj.client.company;

		for (var index = 0; index < obj.items.length; index++) {
			InitPrice = obj.items[index].price;

			if (comp == undefined) {
				var miles = (obj.items[index].quantity || 1);;

				if (obj.items[index]._id == 805) {
					if (miles > 30) {
						subTotal += (miles - initialMile) * costPerMile + (obj.items[index].price)
					} else {
						subTotal += obj.items[index].price
					}
				} else {
					subTotal += (obj.items[index].price * (miles || 1));
				}
			}
			if (obj.items[index]._id == 806 || obj.items[index]._id == 805) {
				if (comp.perHours != undefined) {
					if (comp.perHours == false && comp.initialCost != undefined) {
						InitPrice = comp.initialCost;
						initialMile = comp.initialMile;
						costPerMile = comp.costPerMile;
					} else {
						if (obj.typeTruck._id == 1) {
							costPerHours = comp.costPerHours;
						} else {
							costPerHours = comp.smallTruck;
						}
					}
				}
			}
			if (obj.items[index]._id == 805 && costPerHours == 0) {
				if (obj.items[index].quantity <= initialMile) {
					subTotal += InitPrice
					obj.items[index].price = InitPrice
				} else {
					var minMiles = initialMile;
					var miles = obj.items[index].quantity;

					subTotal += (miles - minMiles) * costPerMile + (InitPrice)
				}
			} else if (obj.items[index]._id == 806 && costPerHours > 0) {
				subTotal += (costPerHours * (obj.items[index].quantity || 1));
			} else {
				subTotal += (obj.items[index].price * (obj.items[index].quantity || 1));
			}
		}

		total += subTotal 

		var subTotalExpenses = 0;
		if (obj.expenses) {
			for (var j = 0; j < obj.expenses.length; j++) {
				subTotalExpenses += obj.expenses[j].price;
			}
			totalExpenses += subTotalExpenses;
		}

		var subTotalProfit = 0;
		subTotalProfit = subTotal - subTotalExpenses;
		totalProfit += subTotalProfit;

		var valueArray = [];

		console.log(obj.crewHeader)
		if (whoIs != "Invoice") {
			if (whoIs == "ServiceOrder") {
				var name = "";
				if (obj.crewHeader && obj.crewHeader[0] && obj.crewHeader[0].name) {
					name = obj.crewHeader[0].name
				}
				valueArray = [moment(obj.date).format('MM/DD/YYYY'), obj.client.company.entity.name, obj.client.branch.name, obj.client.entity.fullName, obj.sor, obj.unitno, obj.invoiceNumber, obj.pono, subTotal, obj.siteAddressFrom ? obj.siteAddressFrom.city.description : '', obj.crewHeader ? name : '', obj.status.description];
			} else {
				valueArray = [moment(obj.date).format('MM/DD/YYYY'), obj.unitno, obj.pono, whoIs == 'ServiceOrder' ? obj.sor : (whoIs == 'WorkOrder' ? obj.wor : obj.dor), obj.invoiceNumber, subTotal, obj.client.branch.name, obj.status.description, moment(obj.date).format('YYYY'), moment(obj.date).format('MM')];
			}
		} else {
			if (queryDescription.expenses) {
				valueArray = [moment(obj.date).format('MM/DD/YYYY'), obj.unitno, obj.pono, obj.invoiceNumber, subTotal, subTotalExpenses, subTotalProfit, obj.sor, obj.wor, obj.dor, obj.client.branch.name, obj.status.description, moment(obj.date).format('YYYY'), moment(obj.date).format('MM')];
			} else {
				valueArray = [moment(obj.date).format('MM/DD/YYYY'), obj.unitno, obj.pono, obj.invoiceNumber, subTotal, obj.sor, obj.wor, obj.dor, obj.client && obj.client.branch ? obj.client.branch.name : '', obj.status.description, moment(obj.date).format('YYYY'), moment(obj.date).format('MM')];
			}
		}

		excel.worksheet.addRow(valueArray);
		excel.worksheet.lastRow.font = normalFont;
		excel.worksheet.lastRow.fill = reportBgColor;
		for (var j = 0; j < fieldsArray.length; j++) {
			excel.worksheet.getCell(i + 7, j + 1).border = border;
		}
		excel.worksheet.getCell('I' + (i + 7).toString()).numFmt = '$ #,###,###,##0.00';
	}
	var key = (objs.length + 7).toString();
	excel.worksheet.addRow(['', '', '', '', '', '', '', 'Total', total, queryDescription.expenses ? totalExpenses : '', queryDescription.expenses ? totalProfit : '', '', '']);
	excel.worksheet.getCell('I' + key).numFmt = '$ #,###,###,##0.00';
	excel.worksheet.getCell('F' + key).numFmt = '$ #,###,###,##0.00';
	excel.worksheet.getCell('G' + key).numFmt = '$ #,###,###,##0.00';
	excel.worksheet.mergeCells('A' + key + ':C' + key);
	excel.worksheet.lastRow.font = boldFont;

	excel.worksheet.getCell("A3").value = (objs.length) + " " + whoIs + "s " + (queryDescription.status ? queryDescription.status + ' ' : '') + (queryDescription.po ? 'With PO Number ' : '') + (queryDescription.pendingPo ? 'Without PO Number ' : '');
	excel.worksheet.getCell("A3").font = subHeaderFont;
	excel.worksheet.getCell("A4").value = total;
	excel.worksheet.getCell("A4").numFmt = '$ #,###,###,##0.00';
	excel.worksheet.getCell("A4").font = subHeaderFont;
	excel.worksheet.mergeCells('A' + 3 + ':E' + 3);
	excel.worksheet.mergeCells('A' + 4 + ':E' + 4);

	//saving file
	var relPath = '/report/r-' + moment().format('MM-DD-YYYY hh:mm') + '.xlsx';
	var filePath = __dirname + relPath;
	excel.workbook.xlsx.writeFile(filePath)
		.then(function () {
			d.resolve({ path: filePath });
		});
	return d.promise;
};

exports.createMonthlyStatement = createMonthlyStatement;
exports.createReport = createReport;