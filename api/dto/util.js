var jLinq = require('jlinq');
var q = require('q');
var md5 = require('MD5');
var _ = require('underscore');

exports.resolve = function (result) {
	return function (result) {
		var deferred = q.defer();
		deferred.resolve(result);
		return deferred.promise;
	};
}

exports.reject = function (result) {
	return function (result) {
		var deferred = q.defer();
		deferred.reject(result);
		return deferred.promise;
	};
}

exports.success = function (res) {
	return function (f) {
		res.send(200, f);
	};
}

exports.error = function (res) {
	return function (f) {
		if (f && f.stack) {
			console.log('[*] Error', f.message);
			console.log('[*] Stack', f.stack);
			f = {
				'error' : f.message,
				'stack' : f.stack
			}
		}
		res.status(510).json(f);
	};
}

exports.getSequence = function (db, table) {
	var deferred = q.defer();
	var seqTable = db.get('SEQUENCE');
	var query = {
		table : table
	};
	var projection = {
		$inc : {
			sequence : 1
		}
	};
	seqTable.findOneAndUpdate(query, projection)
	.then(function (obj) {
		if (obj == null || (obj.value == null && !obj.sequence)) {
			seqTable.insert({
				table : table,
				sequence : 2
			});
			deferred.resolve(1);
		} else {
			deferred.resolve(obj.sequence);
		}
	})
	.catch (function (err) {
		d.reject(err);
	});
	return deferred.promise;
}

exports.getCredentials = function (req, ParentClass) {
	if (!req.user)
		return {};
	if (ParentClass.prototype.getCredentials != undefined) {
		return ParentClass.prototype.getCredentials(req);
	} else {
		var where = {};

		return where;
	}
};

var yearlySequencePrefix = {
	ServiceOrder: 'C'
}

exports.getYearlySequence = function (db, name) {
	var deferred = q.defer();
	var date = new Date();
	var year = date.getFullYear();
	var ySequence = {};
	var query = {
		name : name
	};
	var project = {
		$inc : {
			sequence : 1
		}
	};
	console.log('aqui')
	db.get('YEARLYSEQUENCE').findOneAndUpdate(query, project)
	.then(function (obj) {
		var finalSequence;
		var retorno;
	console.log('aqui 2', obj)
			if (obj && obj.value == null && obj.sequence) {
				finalSequence = obj.sequence + 1;
				retorno = year + '-' + obj.preffix + finalSequence;
				return retorno;
			} else {
				ySequence = {};
				ySequence.name = name;
				ySequence.sequence = 1;
				ySequence.preffix = yearlySequencePrefix[name];

				finalSequence = 1;
				retorno = year + '-' + yearlySequencePrefix[name] + finalSequence;

				return db.get('YEARLYSEQUENCE').insert(ySequence);
			}
	})
	.then(function (retorno) {
		deferred.resolve(retorno);
	})
	.catch (function (error) {
		deferred.reject({
			res : 'Not ok',
			message : 'Error obteniendo la secuencia anual',
			error : err
		});
	});
	return deferred.promise;
};

exports.convertFecha = function (fecha) {
  if (fecha === undefined) {
    fecha = new Date()
  }

  var date = new Date(fecha);
  var dia = (date.getDate() + 1 >= 10) ? date.getDate() + 1 : '0' + (date.getDate())
  var anio = date.getFullYear();
  var mes = (date.getMonth() + 1 >= 10) ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);

  return dia + "/" + mes + "/" + anio;
}

exports.getEnv = function (config) {
	return function (req, res) {
		var isDev = (config.development) ? true : false;
		res.json({
			isDev : isDev
		});
	}
}

exports.errorMessages = function (db, message, res, appId) {
	db.get('ERROR').findOne({
		id : message
	})
	.on('success', function (doc) {
		var err = {
			id : doc.id,
			description : doc.description,
			appId : appId
		}
		res.send(210, err);
	})

}

exports.handleMongoResponse = function (deferred) {
	return function (err, obj) {
		if (err) {
			deferred.reject({
				error : {
					result : 'Not ok',
					data : err
				}
			});
			throw err;
		} else {
			deferred.resolve({
				result : 'Ok',
				data : obj
			});
		}
	};
}

exports.assignError = function (message, error) {
	var responseError = {
		error : {
			res : 'Not ok'
		}
	};
	responseError.error.message = message;
	responseError.error.data = error;
	return responseError;
};
