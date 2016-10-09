var q = require('q'),
  util = require('./util.js')
  Exceljs = require('exceljs');

// Reusable Excel Variables
var fontReportHeader = {
  name: "Calibri (Body)",
  family: 4,
  size: 14,
  bold: true
};

var fontSubTitle = {
    name: "Calibri (Body)",
    color: {
      argb: 'ff808080'
    },
    family: 4,
    size: 9,
    bold: true
  };

var alignRight =  {
    vertical: 'middle',
    horizontal: 'right'
  }
var alignLeft =  {
    vertical: 'middle',
    horizontal: 'left'
  }


var fontDataHeader = {
      name: "Calibri (Body)",
      color: {
        argb: 'FFFFFFFF'
      },
      family: 4,
      size: 10,
      bold: true
    };
var backgroundDataHeader = {
      type: 'gradient',
      gradient: 'angle',
      degree: 0,
      stops: [{
        position: 0,
        color: {
          argb: 'FF013440'
        }
              }, {
        position: 1,
        color: {
          argb: 'FF013440'
        }
              }]
    };
//

function Excel(name,fields, sheetName) {
  this.name = name || 'Reporte';
  this.fields = fields;
  this.currentRow = 1;
  this.createFile(sheetName);
}

Excel.prototype.createFile = function (sheetName) {
	var sheetName = sheetName || 'Sheet1';
	var workbook = new Exceljs.Workbook();

	var sheet = workbook.addWorksheet(sheetName);
  var worksheet = workbook.getWorksheet(sheetName);

  this.workbook = workbook;
  this.worksheet = worksheet;

	return this.workbook;
}

Excel.prototype.addHeader = function (fromDate, toDate) {
	//Private Variables
	var rowValues = [];
  var worksheet = this.worksheet;
  var columns = this.fields.length == 1 ? 4 : this.fields.length
	//Implementation

	//-- First Row --
  rowValues[1] = 'MobileOne';
  rowValues[columns] = this.name;
  worksheet.addRow(rowValues);

  //Get the header to modified and format it
  var row = worksheet.getRow(1);

  //- MedicalCore -
  //Font
  row.font = fontReportHeader;
  //Align Left
  worksheet.getCell("A1").alignment = alignLeft;

  //- Report Name -
  var cell = row.getCell(columns);
  //Font
  // cell.font = fontReportHeader;
  //Align Right
  cell.alignment = alignRight;

  //-- Second Row --

  if (fromDate || toDate) {
  	//Format in readable mode the from date
  	var date = util.convertFecha(fromDate);

  	//If there is a To Date
  	if (toDate)
  		//Format it and add it to the "date" field
  		date += ' - ' + util.convertFecha(toDate);

  	//Set the values
  	rowValues = [];
	  rowValues[columns] = date
	  worksheet.addRow(rowValues);

	  //Get the header to modified and format it
	  row = worksheet.getRow(2);

	  //- Report Date -
	  cell = row.getCell(columns);
	  //Font
	  cell.font = fontSubTitle;
	  //Align Right
	  cell.alignment = alignRight;
  } else {
  	this.worksheet.addRow();
  }

	//Blank Line
	this.worksheet.addRow();
}



Excel.resolve = function(path, obj, aFunction, def) {
  var def = def || '';

  if (path && obj) {
    var a = [obj || self].concat(path.split('.')).reduce(function(prev, curr) {
//      console.log(prev,curr)
      if (prev)
        return prev[curr];
      else
        return null;
    });

    if (aFunction) {
      a = a[aFunction]();
      return a;
    } else if (!aFunction) {}

    if (typeof a == "boolean") {
      a = a ? 'Si':'No';
    }

    return a;

  } else if (typeof aFunction == 'function') {
    return aFunction(obj);
  } else if (aFunction) {
    // console.log(aFunction);
    return 'Function'+aFunction;//obj[aFunction]();
  } else {
    return def;
  }

}

Excel.convertData = function (data,fields) {
  // console.log('convertData - data ** ',data)
//  console.log('convertData - fields',fields)
  //For each row
  return data.map(function (row) {
    //Create an empty object
    var obj = {};

    //Add a property for each field
    fields.forEach(function (field) {

//      console.log(field.name);

      //Find the field value in the row
      obj[field.name] = Excel.resolve(field.routeInDb || field.name,row,field.function, field.def)
    });

    //Return the filled object
    return obj;
  })
}

Excel.prototype.addData = function (data, hasGroups) {
//  console.log('addData - start')
  try {
    var _this = this;
    var fields = this.fields;
    var parsedData = Excel.convertData(data,fields);

		//Si tengo grupos entonces los busco y los Agrego
		if(hasGroups){
			var rowGroups = [];
			for(var i = 0; i < fields.length; i++){
				var groupName = i > 0 ? (fields[i].group != fields[i - 1].group ? (fields[i].group || '') : '') : (fields[i].group || '');
				rowGroups.push(groupName);
			}
			this.worksheet.addRow(rowGroups);
			var rowG = this.worksheet.lastRow;
			rowG.font = fontDataHeader;
			for (var i = 1; i < fields.length; i++) {
				if(fields[i].group){
					var cellG = rowG.getCell(i + 1);
					cellG.fill = backgroundDataHeader;
				}
			}
		}
    this.worksheet.addRow(fields.map(function (field) {
      return field.title
    }));
    //Get the data header row
    var row = this.worksheet.lastRow;
    //Set the font for the entire row
    row.font = fontDataHeader;
    //Set the background color only for the cells filled
    for (var i = 1; i <= fields.length; i++) {
      var cell = row.getCell(i);
      cell.fill = backgroundDataHeader;
    }

    var firstRow = fields.reduce(function (prev,next) {
      prev[next.name] = next.title;
      return prev
    },{})

    var maxlength = parsedData.concat([firstRow]).reduce(function (prev,next) {

      for (var i in next) {
        prev[i] = prev[i] || 0;
        next[i] = next[i] || '';

        prev[i] = Math.max(prev[i],next[i].toString().length);
//        console.log(prev[i],i,next[i])
      }
      return prev;
    },{});
//    console.log('maxlength',maxlength)

    var columns = [];
    for (var i = 0; i < fields.length; i++) {
      // var col = this.worksheet.getColumn(3);
      // col.width = 10000;//maxlength[i] * 6 + 7;
      //
      //
      var column = {
        key: fields[i].name,
        width: maxlength[fields[i].name] + 1
      };


      if (fields[i].type == 'date') {
        column.width = Math.max(fields[i].title.length + 1,8);
      } else if (fields[i].type == 'currency') {
        column.width += 3;
//        console.log('Format',i+1)
        this.worksheet.getColumn(i+1).numFmt = '$ #,###,###,##0.00';

        // column.numFmt = "00000.00%";
      }

      columns.push(column);

    }
//    console.log('columns',columns)
    this.worksheet.columns =  columns;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].type == 'currency') {
        this.worksheet.getColumn(i+1).numFmt = '$ #,###,###,##0.00';
      }
    }

    parsedData.forEach(function (data) {
      _this.worksheet.addRow(data)
    })

  } catch(e){
//    console.log('Error',e)
  }
}

Excel.prototype.addFooter = function (username) {
  this.worksheet.addRow();
  this.worksheet.addRow(["Generated on: "+util.convertFecha(new Date())]);
  this.worksheet.addRow(["Generated by: "+username]);
}

Excel.prototype.download = function (res) {
  res.setHeader('Content-disposition', 'attachment; filename='+this.name+'.xlsx');
	res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

	this.workbook.xlsx.write(res)
  .then(function(){
    res.end();
  });
}

module.exports = Excel;
