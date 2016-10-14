'use strict';

var Company = require('../dto/company');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, Company);
}
