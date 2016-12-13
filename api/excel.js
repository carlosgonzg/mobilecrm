var Excel = require('./dto/excel');
var q = require('q');
var moment = require('moment');
var _ = require('underscore');

var getPaid = function(invoices, year, month){
	return _.reduce(invoices, function(memo, value){
		return memo + (year == value.year && month == value.month && value.status._id == 4 ? value.total : 0);
	}, 0);
};
var getPending = function(invoices, year, month){
	return _.reduce(invoices, function(memo, value){
		return memo + (year == value.year && month == value.month && value.status._id != 4 ? value.total : 0);
	}, 0);
};
var getTotal = function(invoices, year, month){
	return _.reduce(invoices, function(memo, value){
		return memo + (year == value.year && month == value.month ? value.total : 0);
	}, 0);
};

var createMonthlyStatement = function(invoices, whoIs, user){
	var d = q.defer();
  	var excel = new Excel('Monthly Statement', null, 'Monthly Statement');
  	//fonts
	var headerFont = {
		name: "Calibri (Body)",
	 	family: 4,
	  	size: 36,
	  	bold: true
	};
	var normalFont = {
		name: "Calibri (Body)",
	 	family: 4,
	  	size: 14,
	  	bold: false
	};
	var boldFont = {
		name: "Calibri (Body)",
	 	family: 4,
	  	size: 14,
	  	bold: true
	};
	//setting columns
	excel.worksheet.columns = [
		{ key: 'a', width: 27 },
		{ key: 'b', width: 27 },
		{ key: 'c', width: 27 },
		{ key: 'd', width: 27 },
		{ key: 'e', width: 27 }
	];
	//creating detail sheet		
	excel.worksheetDetail = excel.workbook.addWorksheet('Detail');
	excel.worksheetDetail.columns = [
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
		{ key: 'k', width: 27 }
	];
	//header
	excel.worksheet.addRow(['Monthly Statement -', '', whoIs.name, '', 'MOBILE ONE']);
	excel.worksheet.mergeCells('A1:B1');
	excel.worksheet.mergeCells('C1:D1');
	excel.worksheet.lastRow.font = headerFont;
	//sub header
	excel.worksheet.addRow(['Restoration LLC', '', '', '', moment().format('MM/DD/YYYY')]);
	excel.worksheet.mergeCells('A2:B2');
	excel.worksheet.mergeCells('C2:D2');
	excel.worksheet.lastRow.font = boldFont;
	//space!
	excel.worksheet.addRow(['', '', '', '', '']);
	excel.worksheet.mergeCells('A3:E3');
	//table header
	excel.worksheet.addRow(['Year', 'Month', 'Paid', 'Pending', 'Total']);
	excel.worksheet.lastRow.font = boldFont;
	//info
	var today = new Date();
	var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	for(var i = 1; i <= 12; i++){
		excel.worksheet.addRow([today.getFullYear(), months[i], getPaid(invoices, today.getFullYear(), i), getPending(invoices, today.getFullYear(), i), getTotal(invoices, today.getFullYear(), i)]);
		excel.worksheet.getCell('C' + (i + 4).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('D' + (i + 4).toString()).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('E' + (i + 4).toString()).numFmt = '$ #,###,###,##0.00';
	}
	//detail
	excel.worksheetDetail.addRow(['Customer', 'Date', 'Invoice Number', 'Unit Number', 'PO Number', 'Amount', 'Status', 'Year', 'Month', 'Branch', 'Company']);
	excel.worksheetDetail.lastRow.font = boldFont;
	//first of all i'm showing the month/year
	for(var i = 0; i < invoices.length; i++){
		excel.worksheetDetail.addRow([invoices[i].month + ' - ' + invoices[i].year + '(' + invoices[i].status.description + ')', '', '', '', '', '', '', '', '', '', '']);
		excel.worksheetDetail.lastRow.font = boldFont;
		for(var j = 0; j < invoices[i].invoices.length; j++){
			var invoice = invoices[i].invoices[j];
			excel.worksheetDetail.addRow([invoice.client.name, moment(invoice.date).format('MM/DD/YYYY'), invoice.invoiceNumber, invoice.unitno, invoice.pono, invoice.total, invoice.status.description, invoice.year, invoice.month, invoice.branch.name, invoice.company.name]);
			excel.worksheetDetail.lastRow.font = normalFont;
		}
	}
	//saving file
	var relPath =  '/monthlystatement/ms-' + moment().format('MM-DD-YYYY hh:mm') + '.xlsx';
	var filePath = __dirname + relPath;
	excel.workbook.xlsx.writeFile(filePath)
	.then(function(){
		d.resolve({ path: filePath });
	});
	return d.promise;
};

exports.createMonthlyStatement = createMonthlyStatement;