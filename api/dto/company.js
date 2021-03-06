'use strict';

var Crud = require('./crud');
var User = require('./user');
var invoice = require('./invoice');
var q = require('q')

function Company(db, userLogged) {
	this.user = new User(db, '', userLogged);
	this.crud = new Crud(db, 'COMPANY', userLogged);
	this.invoice = new Crud(db, 'INVOICE', userLogged);

	//DB Table Schema
	this.schema = {
		id: '/Company',
		type: 'object',
		properties: {

		}
	};
	this.crud.schema = this.schema;
	this.crud.uniqueFields = ['entity.name'];
}
function pad(number, mask) {
	var dif = mask - number.length;
	dif = dif >= 0 ? dif : mask + Math.abs(dif);
	var s = '';
	for (var i = 0; i < dif; i++) { s += '0'; }
	return s + number;
}
Company.prototype.getSequence = function (id, peek, delivery) {
	var d = q.defer();
	var _this = this;
	console.log(this.invoice)

	_this.crud.find({ _id: Number(id) })
		.then(function (company) {
			company = company.data[0];

			if (delivery == undefined) {
				if (!company || !company.seqCode) {
					d.resolve('Pending Invoice');
				} else {
					var seqNumber = Number(company.seqNumber);
					if (!company.seqNumber) {
						seqNumber = Number(company.seqStart || 0);
					}
					var sequence = company.seqCode + pad(seqNumber.toString(), company.seqMask);

					console.log("UPDATING SEQUENCEEE!!!", peek)
					if (!peek) {
						//actualizo company
						company.seqNumber = seqNumber + 1;

						_this.crud.update({ _id: Number(id) }, company, true)
							.then(function () {
								d.resolve(sequence);
							}, function (err) {
								console.log(err)
								d.resolve(sequence);
							});
					} else {
						d.resolve(sequence);
					}
				}
			} else {
				if (!company || !company.seqCodeDor) {
					d.resolve('Pending Invoice');
				} else {
					var seqNumberDor = Number(company.seqNumberDor);
					if (!company.seqNumberDor) {
						seqNumberDor = Number(company.seqStartDor || 0);
					}
					var sequenceDor = company.seqCodeDor + pad(seqNumberDor.toString(), company.seqMaskDor);

					console.log("UPDATING SEQUENCEEE!!!", peek)
					if (!peek) {
						//actualizo company
						company.seqNumberDor = seqNumberDor + 1;

						_this.crud.update({ _id: Number(id) }, company, true)
							.then(function () {
								d.resolve(sequenceDor);
							}, function (err) {
								console.log(err)
								d.resolve(sequenceDor);
							});
					} else {
						d.resolve(sequenceDor);
					}
				}
			}
		})
		.catch(function (err) {
			console.log(err)
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
}

Company.prototype.getSequenceQuote = function (id, peek) {
	var d = q.defer();
	var _this = this;
	console.log(this.invoice)

	_this.crud.find({ _id: Number(id) })
		.then(function (company) {
			company = company.data[0];

			if (!company || !company.seqCodeQuotes) {
				d.resolve('Pending Estimate #');
			} else {
				var seqNumberQuotes = Number(company.seqNumberQuotes);
				if (!company.seqNumberQuotes) {
					seqNumberQuotes = Number(company.seqStartQuotes || 0);
				}
				var sequenceQuotes = company.seqCodeQuotes + pad(seqNumberQuotes.toString(), company.seqMaskQuotes);

				console.log("UPDATING SEQUENCEEE!!!", peek)
				if (!peek) {
					//actualizo company
					company.seqNumberQuotes = seqNumberQuotes + 1;

					_this.crud.update({ _id: Number(id) }, company, true)
						.then(function () {
							d.resolve(sequenceQuotes);
						}, function (err) {
							console.log(err)
							d.resolve(sequenceQuotes);
						});
				} else {
					d.resolve(sequenceQuotes);
				}
			}
		})
		.catch(function (err) {
			console.log(err)
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
}

Company.prototype.getSequenceSetup = function (id, peek) {
	var d = q.defer();
	var _this = this;

	_this.crud.find({ _id: Number(id) })
		.then(function (company) {
			company = company.data[0];

			if (!company || !company.seqCodeTor) {
				d.resolve('Pending Invoice #');
			} else {
				var seqNumberTor = Number(company.seqNumberTor);
				if (!company.seqNumberTor) {
					seqNumberTor = Number(company.seqStartTor || 0);
				}
				var sequenceTor = company.seqCodeTor + pad(seqNumberTor.toString(), company.seqMaskTor);

				if (!peek) {
					//actualizo company
					company.seqNumberTor = seqNumberTor + 1;

					_this.crud.update({ _id: Number(id) }, company, true)
						.then(function () {
							d.resolve(sequenceTor);
						}, function (err) {
							d.resolve(sequenceTor);
						});
				} else {
					d.resolve(sequenceTor);
				}
			}
		})
		.catch(function (err) {
			d.reject({
				result: 'Not ok',
				errors: err
			});
		});
	return d.promise;
}

Company.prototype.setSequence = function (id) {
	var d = q.defer();
	var _this = this;
	var otherCompany;

	if (id === 7) {
		otherCompany = 3;
	} else if (id === 3) {
		otherCompany = 7;
	}

	_this.crud.find({ _id: Number(id) })
		.then(function (company) {
			var companyData = company.data[0];
			companyData.seqNumber = companyData.seqNumber + 1;

			_this.crud.update({ _id: Number(id) }, companyData, true)
				.then(function () {
					console.log(otherCompany)
					if (otherCompany) {
						_this.crud.find({ _id: Number(otherCompany) })
							.then(function (oCompany) {
								var otherCompanyData = oCompany.data[0];
								otherCompanyData.seqNumber = otherCompanyData.seqNumber + 1;

								_this.crud.update({ _id: Number(otherCompany) }, otherCompanyData, true)
									.then(function () {
										d.resolve(sequence);
									})
							})
					} else {
						d.resolve(sequence)
					}

				}, function (err) {
					console.log(err)
					d.resolve(sequence);
				});
		})
}


Company.prototype.setSequenceDor = function (id) {
	var d = q.defer();
	var _this = this;
	var otherCompany;

	if (id === 7) {
		otherCompany = 3;
	} else if (id === 3) {
		otherCompany = 7;
	}

	_this.crud.find({ _id: Number(id) })
		.then(function (company) {
			var companyData = company.data[0];
			companyData.seqNumberDor = companyData.seqNumberDor + 1;

			_this.crud.update({ _id: Number(id) }, companyData, true)
				.then(function () {
					console.log(otherCompany)
					if (otherCompany) {
						_this.crud.find({ _id: Number(otherCompany) })
							.then(function (oCompany) {
								var otherCompanyData = oCompany.data[0];
								otherCompanyData.seqNumberDor = otherCompanyData.seqNumberDor + 1;

								_this.crud.update({ _id: Number(otherCompany) }, otherCompanyData, true)
									.then(function () {
										console.log("ACTIVO ACTUALIZANDO")
										d.resolve(sequence);
									})
							})
					} else {
						d.resolve(sequence)
					}

				}, function (err) {
					console.log(err)
					d.resolve(sequence);
				});
		})
}

Company.prototype.setSequenceQuote = function (id) {
	var d = q.defer();
	var _this = this;
	var otherCompany;

	if (id === 7) {
		otherCompany = 3;
	} else if (id === 3) {
		otherCompany = 7;
	}

	_this.crud.find({ _id: Number(id) })
		.then(function (company) {
			var companyData = company.data[0];
			companyData.seqNumberQuotes = companyData.seqNumberQuotes + 1;

			_this.crud.update({ _id: Number(id) }, companyData, true)
				.then(function () {
					console.log(otherCompany)
					if (otherCompany) {
						_this.crud.find({ _id: Number(otherCompany) })
							.then(function (oCompany) {
								var otherCompanyData = oCompany.data[0];
								otherCompanyData.seqNumberQuotes = otherCompanyData.seqNumberQuotes + 1;

								_this.crud.update({ _id: Number(otherCompany) }, otherCompanyData, true)
									.then(function () {
										console.log("ACTIVO ACTUALIZANDO")
										d.resolve(sequence);
									})
							})
					} else {
						d.resolve(sequence)
					}

				}, function (err) {
					console.log(err)
					d.resolve(sequence);
				});
		})
}

//Export
module.exports = Company;
