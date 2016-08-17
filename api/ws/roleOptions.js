'use strict';

var RoleOptions = require('../dto/roleOptions');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, RoleOptions);
}
