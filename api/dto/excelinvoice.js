var obj = result.data[0]
		var excel = new Excel(obj.invoiceNumber, null, obj.invoiceNumber);
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
		var miniHeaderFont = {
			name: "Calibri (Body)",
		 	family: 4,
		  	size: 16,
		  	bold: true,
		  	color: {
				argb: 'FF333333'
			}
		};
		var alignCenter =  {
		    vertical: 'middle',
		    horizontal: 'center'
		};
		var alignRight =  {
		    vertical: 'middle',
		    horizontal: 'right'
		};
		var alignLeft =  {
		    vertical: 'middle',
		    horizontal: 'left'
		};
		var background = {
			type: 'gradient',
			gradient: 'angle',
			degree: 0,
			stops: [{
				position: 0,
				color: {
					argb: 'FFD9D9D9'
				}
			}, {
				position: 1,
				color: {
					argb: 'FFD9D9D9'
				}
			}]
	    };

	    var borderTop = { top: {style:'thin'} };
	    var borderBottom = { bottom: {style:'thin'} };
	    var borderLeft = { left: {style:'thin'} };
	    var borderRight = { right: {style:'thin'} };
	    var borderTopRight = { right: {style:'thin'}, top: { style: 'thin'} };
	    var borderTopLeft = { left: {style:'thin'} , top: { style: 'thin'}};
	    var borderBottomRight = { right: {style:'thin'}, bottom: { style: 'thin'} };
	    var borderBottomLeft = { left: {style:'thin'}, bottom: { style: 'thin'} };

	    excel.worksheet.columns = [
		    { key: 'a', width: 10 },
		    { key: 'b', width: 10 },
		    { key: 'c', width: 22 },
		    { key: 'd', width: 2 },
		    { key: 'e', width: 20 },
		    { key: 'f', width: 11 },
		    { key: 'g', width: 15 },
		    { key: 'h', width: 7 },
		    { key: 'i', width: 34 }
		];

		//Header
		excel.worksheet.addRow(['MOBILEONE', '', '', '', '', '', '', 'INVOICE', '']);
		excel.worksheet.mergeCells('A1:E1');
		excel.worksheet.mergeCells('H1:I1');
		excel.worksheet.lastRow.font = headerFont;
		excel.worksheet.getCell("A1").alignment = alignLeft;
		excel.worksheet.getCell("I1").alignment = alignRight;
		excel.worksheet.addRow(['Restoration LLC', '', '', '', '', '', '', moment(obj.createDate).format('MM/DD/YYYY'), '']);
		excel.worksheet.mergeCells('A2:C2');
		excel.worksheet.mergeCells('H2:I2');
		excel.worksheet.lastRow.font = boldFont;
		excel.worksheet.getCell("B2").alignment = alignRight;
		excel.worksheet.getCell("H2").alignment = alignCenter;
		excel.worksheet.addRow(['', '', '', '', '', '', 'Invoice #', '', obj.invoiceNumber]);
		excel.worksheet.mergeCells('G3:H3');
		excel.worksheet.lastRow.font = boldFont;
		excel.worksheet.getCell("G3").alignment = alignRight;
		//Client and Provider Info
		excel.worksheet.addRow();
		excel.worksheet.addRow(['SERVICE PROVIDER', '', '', '', 'CUSTOMER', '', '', '', '']);
		excel.worksheet.mergeCells('A5:C5');
		excel.worksheet.mergeCells('E5:I5');
		excel.worksheet.lastRow.font = miniHeaderFont;
		excel.worksheet.getCell("A5").alignment = alignCenter;
		excel.worksheet.getCell("E5").alignment = alignCenter;
		excel.worksheet.getCell('A5').fill = background;
		excel.worksheet.getCell('E5').fill = background;
		//Service Provider Info
		excel.worksheet.addRow(['Mobileone Restoration LLC', '', '', '', obj.client.entity.fullName, '', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;
		excel.worksheet.mergeCells('A6:C6');
		excel.worksheet.mergeCells('E6:I6');

		excel.worksheet.addRow(['172 Harwood Circle', '', '', '', obj.siteAddress.address1, '', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;
		excel.worksheet.mergeCells('A7:C7');
		excel.worksheet.mergeCells('E7:I7'); 

		excel.worksheet.addRow(['Kissimmee, FL. 34744', '', '', '', obj.siteAddress.state.description, '', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;
		excel.worksheet.mergeCells('A8:C8');
		excel.worksheet.mergeCells('E8:I8');

		excel.worksheet.addRow(['Phone: 4073348802', '', '', '', obj.phone.phoneType.description + ': ' + obj.phone.number, '', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;
		excel.worksheet.mergeCells('A9:C9');
		excel.worksheet.mergeCells('E9:I9');

		excel.worksheet.addRow(['mobileonerestorationllc@gmail.com', '', '', '', obj.client.account.email, '', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;
		excel.worksheet.mergeCells('A10:C10');
		excel.worksheet.mergeCells('E10:I10');

		excel.worksheet.addRow();

		//COMMENT
		excel.worksheet.addRow(['Project Description', '', '', '', '', '', '', '', '']);
		excel.worksheet.lastRow.font = miniHeaderFont;
		excel.worksheet.getCell('A12').fill = background;
		excel.worksheet.mergeCells('A12:I12');

		excel.worksheet.addRow([obj.comment, '', '', '', '', '', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;
		excel.worksheet.mergeCells('A13:I13');
		
		//invoce (parts)
		excel.worksheet.addRow();
		//header
		excel.worksheet.addRow(['Code', 'Description', '', '', '','Part', 'Cost per Unit', 'Qty.', 'Total']);
		excel.worksheet.mergeCells('B15:E15');
		excel.worksheet.getCell('A15').fill = background;
		excel.worksheet.getCell('B15').fill = background;
		excel.worksheet.getCell('E15').fill = background;
		excel.worksheet.getCell('F15').fill = background;
		excel.worksheet.getCell('G15').fill = background;
		excel.worksheet.getCell('H15').fill = background;
		excel.worksheet.getCell('I15').fill = background;
		excel.worksheet.getCell('I15').alignment = alignCenter;
		excel.worksheet.lastRow.font = miniHeaderFont;
		for(var i = 0; i < obj.items.length; i++){
			var item = obj.items[i];
			var idCell = (16 + i);
			excel.worksheet.addRow([ item.code, item.description, '', '', '',item.part, item.price, item.quantity, item.price * item.quantity]);
			excel.worksheet.lastRow.font = normalFont;
			excel.worksheet.mergeCells('B' + idCell + ':' + 'E' + idCell);
			excel.worksheet.getCell('G' + idCell).numFmt = '$ #,###,###,##0.00'
			excel.worksheet.getCell('I' + idCell).numFmt = '$ #,###,###,##0.00'
		}
		//Bottom footer
		var lastIdCell = 16 + obj.items.length + 1;
		var subTotalCell = lastIdCell - 1;
		var totalCell = lastIdCell;
		console.log(lastIdCell, subTotalCell, totalCell)
		excel.worksheet.addRow(['', '', '', '','','','Subtotal','',obj.total]);
		excel.worksheet.lastRow.font = miniHeaderFont;
		excel.worksheet.mergeCells('G' + subTotalCell + ':' + 'H' + subTotalCell);
		excel.worksheet.getCell('I' + subTotalCell).numFmt = '$ #,###,###,##0.00';
		excel.worksheet.getCell('G' + subTotalCell).alignment = alignRight;
		
		excel.worksheet.addRow(['ADDRESS:', '', '', '', '','', 'Total', '', obj.total]);
		excel.worksheet.lastRow.font = miniHeaderFont;
		excel.worksheet.getCell('A'+lastIdCell).fill = background;
		excel.worksheet.mergeCells('A' + lastIdCell + ':' + 'B' + lastIdCell);
		excel.worksheet.mergeCells('G' + totalCell + ':' + 'H' + totalCell);
		excel.worksheet.getCell('G'+totalCell).fill = background;
		excel.worksheet.getCell('I' + totalCell).numFmt = '$ #,###,###,##0.00'
		excel.worksheet.getCell('G' + totalCell).alignment = alignRight;

		excel.worksheet.addRow(['PO#', obj.pono, '', '', '','', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;

		excel.worksheet.addRow(['Unit#', obj.unitno, '', '', '','', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;
		

		excel.worksheet.addRow(['ISO#', obj.isono, '', '', '','', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;

		excel.worksheet.addRow(['Location', obj.siteAddress.city.description, '', '', '','', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;

		excel.worksheet.addRow(['SOR', obj.sor, '', '', '','', '', '', '']);
		excel.worksheet.lastRow.font = normalFont;

        excel.addFooter(username);