'use strict';

var Option = require('../dto/option');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, Option);
}
