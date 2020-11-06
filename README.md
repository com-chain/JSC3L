# JSC3L
JavaScript Com-Chain Communication Library

# Work in progress
This lib was extracted from Biletujo project.

The following files have to be cleaned:
 - myetherwallet
 - uiFunc
 - etherUnits
 - ajaxReq
 - ethFuncs

Other functionality may still be ported into JSC3L
 - Access to the history of the transaction
 - messages with the transaction

# Dependency
could be imported as node module or directly

 - BigNumber (https://github.com/MikeMcl/bignumber.js/)
 - Etherumjs-utils (https://github.com/ethereumjs/ethereumjs-util)
 
 
# JS import

var BigNumber = require('bignumber.js');

window.BigNumber = BigNumber;

var ethUtil = require('ethereumjs-util');

ethUtil.crypto = require('crypto');

ethUtil.Tx = require('ethereumjs-tx');

ethUtil.scrypt = require('scryptsy');

ethUtil.uuid = require('uuid');

ethUtil.EC = require('elliptic').ec;

window.ethUtil = ethUtil;

var Wallet = require('./myetherwallet');

window.Wallet = Wallet;

var uiFuncs = require('./uiFuncs');

window.uiFuncs = uiFuncs;

var etherUnits = require('./etherUnits');

window.etherUnits = etherUnits;

var ajaxReq = require('./ajaxReq');

window.ajaxReq = ajaxReq;

var ethFuncs = require('./ethFuncs');

window.ethFuncs = ethFuncs;


var jsc3l_config = require('./jsc3l_config');

window.jsc3l_config = jsc3l_config;

var jsc3l_connection = require('./jsc3l_connection');

window.jsc3l_connection = jsc3l_connection;

var jsc3l_connection = require('./jsc3l_connection');

window.jsc3l_connection = jsc3l_connection;

var jsc3l_customization = require('./jsc3l_customization');

window.jsc3l_customization = jsc3l_customization;

var jsc3l_bcRead = require('./jsc3l_bcRead');

window.jsc3l_bcRead = jsc3l_bcRead;

var jsc3l_bcTransaction = require('./jsc3l_bcTransaction');

window.jsc3l_bcTransaction = jsc3l_bcTransaction;
