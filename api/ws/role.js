'use strict';

var Role = require('../dto/role');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, Role);
}
