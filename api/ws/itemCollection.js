'use strict';

var ItemCollection = require('../dto/itemCollection');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, ItemCollection);
}
