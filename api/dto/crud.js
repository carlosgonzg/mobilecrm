'use strict';

var q = require('q'),
util = require('./util'),
Excel = require('./excel'),
Validator = require('jsonschema').Validator,
math = require('sinful-math');
var moment = require('moment')
//Constructor
function Crud(db, table, userLogged, filterByUser) {
	this.table = table;
	this.db = db;
	this.validator = new Validator();
	this.uniqueFields = [];
	this.schema = {};
	this.userLogged = userLogged || {};
	this.filterByUser = filterByUser;
}

//Funcion para manejar las respuestas de Mongo
function handleMongoResponse(deferred) {
	return function (err, data) {
		if (err) {
			deferred.reject({
				result : 'Not ok',
				data : err
			});
			throw err;
		} else {
			deferred.resolve({
				result : "Ok",
				data : data
			});
		}
	};
}

var accented = {
  'A': '[aàáâäãÅåæ]',
  'B': '[bß]',
  'C': '[cçÇ]',
  'D': '[d]',
  'E': '[eèéêëÆæœ]',
  'F': '[f]',
  'G': '[g]',
  'H': '[h]',
  'I': '[iíïî]',
  'J': '[j]',
  'K': '[k]',
  'L': '[l]',
  'M': '[m]',
  'N': '[nñ]',
  'O': '[oòóõöôØøœ]',
  'P': '[p]',
  'Q': '[q]',
  'R': '[r]',
  'S': '[s]',
  'T': '[t]',
  'U': '[uûüùú]',
  'V': '[v]',
  'W': '[w]',
  'X': '[x]',
  'Y': '[yýÿ]',
  'Z': '[z]'
};

var convertStringRegExp = function (string) {
  var _string = '';
  string = (string || '').toUpperCase();
  for (var x in string) {
    _string = _string.concat(accented[string[x]] || string[x]);
  }

  var split = _string.split(' ');
  for (var x in split) {
    split[x] = '(?=.*' + split[x] + ')';
  }
  var _string = '';
  for (var x in split) {
    _string = _string.concat(split[x]);
  }
  return _string;
};

//Funcion que verifica si el objeto a ser insertado ya lo esta.
var checkUniqueFields = function (object, crud) {
  var deferred = q.defer();
  var query = {
      '$or': []
    };
  var uniqueFields = crud.uniqueFields;
  var prop;
  if (uniqueFields.length !== 0) {
    for (var x in uniqueFields) {
      prop = {};
      if (Array.isArray(uniqueFields[x])) {
        prop.$and = uniqueFields[x].map(function (field) {
          var obj = {};
          obj[field] = object[field];
          return obj;
        })
      } else {
				var fields = uniqueFields[x].split('.');
				var objectValue = object;
        fields.forEach(function (field) {
          objectValue = objectValue[field];
				});
        prop[uniqueFields[x]] = objectValue;
      }
      query.$or.push(prop);
    }
    query._id = {
      $ne: object._id
    };
    crud.db.get(crud.table).find(query, function (err, data) {
			if (data) {
        if (data.length > 0) {
          deferred.resolve({
						exists: true
					});
        } else {
          deferred.resolve({
            exists: false
          });
        }
      } else {
        deferred.reject({
          res: 'Not ok',
					exists: true,
          error: err,
          message: 'The search could not be done properly'
        });
      }
    });
  } else {
    deferred.resolve({
      exists: false
    });
  }
  return deferred.promise;
};

//Funcion para validar un objeto antes de que sea insertado. (Utiliza el esquema especificado en la clase)
Crud.prototype.validate = function (object) {
	var d = q.defer();
	try {
		if (this.schema === null) {
			throw new Error('Schema is not defined');
		}
		var validated = this.validator.validate(object, this.schema);
		if (validated.errors.length == 0) {
			d.resolve(true);
		} else {
			d.reject(validated.errors);
		}
	} catch (e) {
		d.reject(e);
	}
	return d.promise;
};

function convertToDate(object) {
	var key;
	var dateRegex = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
	for (key in object) {
		//Si es un arreglo, para cada elemento, recursivamente actualizar sus propiedades
		if (Array.isArray(object[key])) {
			for (var i in object[key]) {
				object[key][i] = convertToDate(object[key][i])
			}
			//Si es un objeto recursivamente actualizar sus propiedades
		}
		if (typeof object[key] == "object") {
			object[key] = convertToDate(object[key])
		} else if (typeof object[key] == "string") {
			if (/date|fecha/.test(key.toLowerCase()) || dateRegex.test(object[key])) {
				object[key] = new Date(object[key]);
				if (isNaN(object[key])) {
					object[key] = undefined;
				}
			}
		}
	}
	return object;
};

// Funcion que inserta un nuevo objeto en la base de datos. (Primero se verifica si existe)
Crud.prototype.insert = function (newObject, overrideUniqueFields) {
	var d = q.defer();
	var _this = this;
	newObject = convertToDate(newObject);
	newObject.createdDate = new Date();
	newObject.createdBy = _this.userLogged;
	_this.validate(newObject)
	.then(function () {
		delete newObject.baseApiPath;
		delete newObject.errors;
		return overrideUniqueFields ? q.when({ exists: false }) : checkUniqueFields(newObject, _this);
	})
	.then(function (data) {
		if (!data.exists) {
			return util.getSequence(_this.db, _this.table);
		} else {
			throw 'The object already exists';
		}
	})
	.then(function (sequence) {
		newObject._id = sequence;
		if (newObject.baseApiPath) {
			delete newObject.baseApiPath;
		}
		return _this.db.get(_this.table).insert(newObject);
	})
	.then(function (data) {
		d.resolve({
			result : "Ok",
			data : data
		});
	})
	.catch(function (error) {
    console.log(error)
		d.reject({
			result : 'Not ok',
			error : error,
			message : 'Validation Errors'
		});
	});
	return d.promise;
};

Crud.prototype.remove  = function (query) {
	var deferred = q.defer();

	if (JSON.stringify(query) === '{}') {
		throw new Error('query is not defined');
	}

	if (!isNaN(query)) {
		query = {
			_id : parseInt(query)
		};
	}


	this.db.get(this.table).remove(query, {
		justOne : 1
	}, function (err, data) {

		if (err) {
			throw err;
		}
		if (data.result.ok) {
			deferred.resolve({
				result : "Ok",
				data : data
			});
		} else {
			deferred.reject({
				result : "Not ok",
				data : data
			});
		}
	});

	return deferred.promise;
};

Crud.prototype.update = function (qry, obj, overrideUniqueFields) {
	var d = q.defer();
	var query = qry;
	var _this = this;
	if (query === undefined || JSON.stringify(query) === '{}') {
		throw new Error('query is not defined');
	}
	if (obj === undefined || JSON.stringify(obj) === '{}') {
		throw new Error('obj is not defined');
	}

  //CODIGO PARA AGREGAR LA FECHA DE MODIFICACION DE LAS TABLAS.
  obj.ModifiedDate = new Date();
  obj.ModifiedBy = this.userLogged

	obj = convertToDate(obj);
  _this.validate(obj)
	.then(function () {
		delete obj.baseApiPath;
		delete obj.errors;
    delete obj.ok;
    delete obj.nModified;
    delete obj.n;
		return checkUniqueFields(obj, _this);
	})
	.then(function (data) {
			if (!data.exists || overrideUniqueFields) {
				return _this.db.get(_this.table).update(query, {
					$set : obj
				}, { multi: true });
			} else {
				throw new Error('This object already exists');
			}
	})
	.then(function (data) {
			d.resolve(data);
	})
	.catch (function (error) {
		d.reject({
			result : 'Not ok',
			error : error,
			message : 'Validation Errors'
		});
	});
	return d.promise;
};

Crud.prototype.find = function (query, sort) {
	var deferred = q.defer(),
	date;
	query = typeof query === 'string' ? JSON.parse(query) : query;
	//Cuando se manda fecha de inicio
	if (query.fromDate !== undefined && query.fromDate !== "") {
		if (query.$and === undefined) {
			query.$and = [];
		}

		date = {};
		date.entryDate = {
			$gte : new Date(query.fromDate)
		};
		query.$and.push(date);
	}
	//Cuando se manda fecha de fin
	if (query.toDate !== undefined && query.toDate !== "") {
		if (query.$and === undefined) {
			query.$and = [];
		}

		date = {};
		date.entryDate = {
			$lte : new Date(query.toDate)
		};
		query.$and.push(date);
	}
	delete query.fromDate;
	delete query.toDate;

	query = convertToDate(query);

	if(this.userLogged && this.userLogged._id && this.userLogged.role._id != 1 && this.filterByUser){
		query['createdBy._id'] = this.userLogged._id;
	}

	var sortObj = sort ? sort : 
    { 
        _id: 1
    };
	this.db.get(this.table).find(query, {
		sort : sortObj
	}, handleMongoResponse(deferred));
	return deferred.promise;
};

Crud.prototype.excel = function (query, username, res) {
  delete query.limit
  delete query.skip

  this.paginatedSearch(query)
    .then(function (data) {
      try {
        var excel = new Excel(query.title, query.excelFields);
        excel.addHeader();
        excel.addData(data.data);
        excel.addFooter(username);
        excel.download(res);

      } catch (e) {
        util.error(res)(e);
      }
    });
}

Crud.prototype.count = function (query) {
	var deferred = q.defer();
	query = typeof query === 'string' ? JSON.parse(query) : query;

	this.db.get(this.table).count(query, handleMongoResponse(deferred));
	return deferred.promise;
};

//Parameters
//table: name of the colletion
//limit: number of records
//skip: number of records to be skipped
//sort: object with the fields in which the query is going to be sorted
//filter: filter that is gonna be used, must be passed as a String
//search: a string that is going to be look in a set of fields
//fields: array of strings with the fields names that the 'search' attribute is going to be looked in
//

Crud.prototype.paginatedSearch = function (query) {
  try {
    var deferred = q.defer();
    var where = {};
    if (query.filter) {
      if (typeof query.filter == 'string') {
        try {
          where = JSON.parse(query.filter);
        } catch (e) {
        }
      } else {
        where = query.filter;
      }
    }
    var search = query.search;
    var dateRange = query.dateRange;
    var fields = query.fields;
    var field = {};

    // Pagination Limits
    var pagination = {
      limit: query.limit,
      skip: query.skip,
      sort: query.sort
    }

    if (!query.all) {
      if (Array.isArray(fields) && fields.length > 0) {
        fields.forEach(function (item) {
          field[item] = 1;
        });
        pagination.fields = field;
      }
    }
    where = joinObjects(where, this.where);
    if (query.noAuth) {

    }
    // Filtro por multiples campos
    if (search)
      search = (isNaN(search)) ? convertStringRegExp(search) : Number(search);

    if (Array.isArray(fields) && fields.length > 0 && search) {
      where.$or = where.$or || [];
      fields.forEach(function (field) {
        var obj = {};
        if (isNaN(search)) {
          obj[field] = {
            $regex: search,
            $options: 'i'
          }

        } else { //Es un numero

          //Fix: To ignore documents where the property is missing
          var tmp = "try { return String(this.XFIELD).match(XSEARCH) } catch (e) { return false}";

          tmp = tmp.replace(/XFIELD/g, field);
          tmp = tmp.replace(/XSEARCH/g, search);

          obj = {
            $where: tmp
          }
        }
        where.$or.push(obj);
      });
    }
    if (where.$or && where.$or.length == 0) {
      delete where.$or;
    }
    // Filtro por multiples campos para fecha
    if (dateRange != undefined && dateRange != "") {
      where.$and = (where.$and) ? where.$and : [];
      var fieldsRange = dateRange.fields;

      var fechaInicio = (dateRange.start) ? moment(dateRange.start) : null;
      var fechaFin = (dateRange.end) ? moment(dateRange.end) : null;
      var objectStart = (fechaInicio) ? new Date(fechaInicio) : null;
      var objectEnd = (fechaFin) ? new Date(fechaFin) : null;
      fieldsRange.forEach(function (field) {
        var obj = {};
        obj[field] = {};
        if (objectStart) {
          obj[field].$gte = new Date(objectStart.getFullYear(), objectStart.getMonth(), objectStart.getDate(), 0, 0, 0, 0);
        }
        if (objectEnd) {
          obj[field].$lte = new Date(objectEnd.getFullYear(), objectEnd.getMonth(), objectEnd.getDate(), 23, 59, 59, 999);
        }
        where.$and.push(obj);
      })
    }
    this.db.get(this.table).find(where, pagination, handleMongoResponse(deferred));

  } catch (e) {
    deferred.reject(e);
  }

  return deferred.promise;
};


function joinObjects(objTo, objFrom) {
  for (var i in objFrom) {
    //Si la propiedad ya existe en el objeto base
    if (objTo[i]) {
      //Verificar si es un arreglo y si el que se quiere copiar es un arreglo concatenar
      if (Array.isArray(objTo[i]) && Array.isArray(objFrom[i])) {
        objTo[i] = objTo[i].concat(objFrom[i]);
      }
      //De lo contrario agregar la propiedad
    } else {
      objTo[i] = objFrom[i];
    }
  };
  return objTo;
};
Crud.prototype.paginatedCount = function (query) {
  var deferred = q.defer();

  var where = {};
  if (query.filter != undefined) {
    if (typeof query.filter == 'string') {
      try {
        where = JSON.parse(query.filter);
      } catch (e) {
      }
    } else {
      where = query.filter;
    }
  }
  var search = query.search,
    fields = query.fields,
    dateRange = query.dateRange,
    startDate = query.startDate,
    endDate = query.endDate,
    pagination = {
      limit: query.limit,
      skip: query.skip,
      sort: query.sort
    }

  // Login Credentials
  where = joinObjects(where, this.where);
  // Filtro por multiples campos
  if (Array.isArray(fields) && fields.length > 0 && search) {
    where.$or = [];
    fields.forEach(function (field) {
      var obj = {};
      // MEJORAR LA BUSQUEDA
      if (isNaN(search)) {
        obj[field] = {
          $regex: search,
          $options: 'i'
        }
      } else {
        //Fix: To ignore documents where the property is missing
        var tmp = "try { return String(this.XFIELD).match(XSEARCH) } catch (e) { return false}";

        tmp = tmp.replace(/XFIELD/g, field);
        tmp = tmp.replace(/XSEARCH/g, search);

        obj = {
          $where: tmp
        }
      }
      where.$or.push(obj);
    });
  }

  // Filtro por multiples campos para fecha
  if (dateRange != undefined && dateRange != "") {
    where.$and = [];
    var fieldsRange = dateRange.fields;
    var fechaInicio = dateRange.start.toString().split('-');
    var fechaFin = dateRange.end.toString().split('-');
    var objectStart = {
      dia: fechaInicio[2].substring(0, 2),
      mes: fechaInicio[1],
      ano: fechaInicio[0]
    };
    var objectEnd = {
      dia: fechaFin[2].substring(0, 2),
      mes: fechaFin[1],
      ano: fechaFin[0]
    };
    fieldsRange.forEach(function (field) {
      var obj = {};
      obj[field] = {
        $gte: new Date(objectStart.ano, objectStart.mes - 1, objectStart.dia, 0, 0, 0),
        $lte: new Date(objectEnd.ano, objectEnd.mes - 1, objectEnd.dia, 23, 59, 59)
      };
      where.$and.push(obj);
    })
  }

  if (startDate != undefined && startDate != "") {
    if (where.$and == undefined) {
      where.$and = [];
    }
    var from = startDate.date.toString().split('-');
    var obj = {
      dia: from[2].substring(0, 2),
      mes: from[1],
      ano: from[0]
    };
    var date = {};
    date[startDate.field] = {
      $gte: new Date(obj.ano, obj.mes - 1, obj.dia, 0, 0, 0)
    };
    where.$and.push(date);

  }

  if (endDate != undefined && endDate != "") {
    if (where.$and == undefined) {
      where.$and = [];
    }
    var from = endDate.date.toString().split('-');
    var obj = {
      dia: from[2].substring(0, 2),
      mes: from[1],
      ano: from[0]
    };
    var date = {};
    date[endDate.field] = {
      $lte: new Date(obj.ano, obj.mes - 1, obj.dia, 23, 59, 59)
    };
    where.$and.push(date);
  }

  // Clear
  if (where.$or && where.$or.length == 0) {
    delete where.$or;
  }
  if (where.$and && where.$and.length == 0) {
    delete where.$and;
  }

  this.db.get(this.table).count(where, /*pagination,*/ handleMongoResponse(deferred));

  return deferred.promise;
};

Crud.prototype.getNext = function (date) {
	var deffered = q.defer();
	var query = {};
	if (date) {
		query = {
			date : {
				$gt : new Date(date)
			}
		};
	} else {
		query = {
			date : {
				$gt : new Date()
			}
		};
	};

	this.db.get(this.table).find(query, {
		sort : [['date', 1]],
		limit : 1
	}, function (err, data) {
		if (err) {
			deffered.reject(err);
		};
		if (data) {
			deffered.resolve(data);
		};
	});

	return deffered.promise;
};

Crud.prototype.getPrevious = function (date) {
	var deffered = q.defer();
	var query = {};

	if (date) {
		query = {
			date : {
				$lt : new Date(date)
			}
		};
	} else {
		query = {
			date : {
				$lt : new Date()
			}
		};
	};

	this.db.get(this.table).find(query, {
		sort : [['date', -1]],
		limit : 1
	}, function (err, data) {
		if (err) {
			deffered.reject(err);
		};
		if (data) {
			deffered.resolve(data);
		};
	});

	return deffered.promise;
};

Crud.prototype.getActualSequence = function (db, table) {
  var deferred = q.defer();
  var seqTable = db.get('SEQUENCE');
  var query = {
    table : table
  };
  seqTable.findOne(query)
  .then(function (obj) {
    if (obj == null || (obj.value == null && !obj.sequence)) {
      deferred.resolve(1);
    } else {
      deferred.resolve(obj.sequence.toString());
    }
  })
  .catch (function (err) {
    d.reject(err);
  });
  return deferred.promise;
}

//Private Functions
function handleMongoResponse(deferred) {
	return function (err, data) {
		if (err) {
			deferred.reject({
				result : 'Not ok',
				errors : err
			});
			throw err;
		} else {
			deferred.resolve({
				result : "Ok",
				data : data
			});
		}
	};
}

//Export
module.exports = Crud;
