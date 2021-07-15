import ajaxReq from './ajaxReq'

const jsc3l = function () {}

const blockies = require('./blockies')
jsc3l.blockies = blockies
const Wallet = require('./myetherwallet')
jsc3l.Wallet = Wallet
const etherUnits = require('./etherUnits')
jsc3l.etherUnits = etherUnits
console.log(ajaxReq)
jsc3l.ajaxReq = ajaxReq
const ethFuncs = require('./ethFuncs')
jsc3l.ethFuncs = ethFuncs
const jsc3l_config = require('./jsc3l_config')
jsc3l.jsc3l_config = jsc3l_config
const jsc3l_connection = require('./jsc3l_connection')
jsc3l.jsc3l_connection = jsc3l_connection
const jsc3l_customization = require('./jsc3l_customization')
jsc3l.jsc3l_customization = jsc3l_customization
const jsc3l_bcRead = require('./jsc3l_bcRead')
jsc3l.jsc3l_bcRead = jsc3l_bcRead
const jsc3l_message = require('./jsc3l_message')
jsc3l.jsc3l_message = jsc3l_message
const jsc3l_wallet = require('./jsc3l_wallet')
jsc3l.jsc3l_wallet = jsc3l_wallet
const jsc3l_bcTransaction = require('./jsc3l_bcTransaction')
jsc3l.jsc3l_bcTransaction = jsc3l_bcTransaction

module.exports = jsc3l
