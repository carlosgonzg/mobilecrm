'use strict';

var q = require('q');
var ServiceOrder = require('./serviceOrder');
var WorkOrder = require('./workOrder');

function Report(db, userLogged, dirname) {
	this.serviceOrder = new ServiceOrder(db, userLogged, dirname);
	this.workOrder = new WorkOrder(db, userLogged, dirname);
}

Report.prototype.getReport = function(){

};
module.exports = ServiceOrder;
