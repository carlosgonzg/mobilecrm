'use strict';

var State = require('../dto/state');

module.exports = function (prefix, app) {
	require('./crud')(prefix, app, State);
}
