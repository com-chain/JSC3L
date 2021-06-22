
var BigNumber = require('bignumber.js'); //npm install bignumber.js@2.4.0
window.BigNumber = BigNumber;

var ethUtil = require('ethereumjs-util'); 
ethUtil.crypto = require('crypto'); 
ethUtil.Tx = require('ethereumjs-tx');   ///npm install ethereumjs-tx@1.1.2
ethUtil.scrypt = require('scryptsy');
ethUtil.uuid = require('uuid');
ethUtil.sha3 = require('sha3');
ethUtil.EC = require('elliptic').ec;
window.ethUtil = ethUtil;

var jsc3l = require('@com-chain.org/jsc3l');

var blockies = jsc3l.blockies;
window.blockies = jsc3l.blockies;
window.Wallet = jsc3l.Wallet;
window.uiFuncs = jsc3l.uiFuncs;
window.etherUnits = jsc3l.etherUnits;
window.ajaxReq = jsc3l.ajaxReq;
window.ethFuncs =  jsc3l.ethFuncs;
window.jsc3l_config = jsc3l.jsc3l_config;
window.jsc3l_connection = jsc3l.jsc3l_connection;
window.jsc3l_customization =  jsc3l.jsc3l_customization;
window.jsc3l_bcRead = jsc3l.jsc3l_bcRead;
window.jsc3l_message = jsc3l.jsc3l_message;
window.jsc3l_wallet = jsc3l.jsc3l_wallet;
window.jsc3l_bcTransaction = jsc3l.jsc3l_bcTransaction;


