'use strict';

var Item = require('../dto/item');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, Item);
}
