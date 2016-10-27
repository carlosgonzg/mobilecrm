'use strict';

var Branch = require('../dto/branch');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, Branch);
}
