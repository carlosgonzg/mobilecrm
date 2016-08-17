'use strict';

var Country = require('../dto/country');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, Country);
}
