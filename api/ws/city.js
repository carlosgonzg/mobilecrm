'use strict';

var City = require('../dto/city');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, City);
}
