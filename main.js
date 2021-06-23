var jsc3l = function() {};

var blockies = require('./blockies');
jsc3l.blockies = blockies;
var Wallet = require('./myetherwallet');
jsc3l.Wallet = Wallet;
var uiFuncs = require('./uiFuncs');
jsc3l.uiFuncs = uiFuncs;
var etherUnits = require('./etherUnits');
jsc3l.etherUnits = etherUnits;
var ajaxReq = require('./ajaxReq');
jsc3l.ajaxReq = ajaxReq;
var ethFuncs = require('./ethFuncs');
jsc3l.ethFuncs = ethFuncs;
var jsc3l_config = require('./jsc3l_config');
jsc3l.jsc3l_config = jsc3l_config;
var jsc3l_connection = require('./jsc3l_connection');
jsc3l.jsc3l_connection = jsc3l_connection;
var jsc3l_customization = require('./jsc3l_customization');
jsc3l.jsc3l_customization = jsc3l_customization;
var jsc3l_bcRead = require('./jsc3l_bcRead');
jsc3l.jsc3l_bcRead = jsc3l_bcRead;
var jsc3l_message = require('./jsc3l_message');
jsc3l.jsc3l_message = jsc3l_message;
var jsc3l_wallet = require('./jsc3l_wallet');
jsc3l.jsc3l_wallet = jsc3l_wallet;
var jsc3l_bcTransaction = require('./jsc3l_bcTransaction');
jsc3l.jsc3l_bcTransaction = jsc3l_bcTransaction;


module.exports = jsc3l;
