import Tx from 'ethereumjs-tx'

import ajaxReq from './ajaxReq'
import * as ethFuncs from './ethFuncs'
import * as etherUnits from './etherUnits'

const isNumeric = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

export function isTxDataValid (txData) {
  if (txData.to !== '0xCONTRACT' &&
      !ethFuncs.validateEtherAddress(txData.to)) {
    throw 'ERROR_6'
  } else if (!isNumeric(txData.value) ||
             parseFloat(txData.value) < 0) {
    throw 'ERROR_8'
  } else if (!isNumeric(txData.gasLimit) ||
             parseFloat(txData.gasLimit) <= 0) {
    throw 'ERROR_9'
  } else if (!ethFuncs.validateHexString(txData.data)) {
    throw 'ERROR_10'
  }
  if (txData.to === '0xCONTRACT') txData.to = ''
}

export function generateTx (txData, callback) {
  try {
    isTxDataValid(txData)
    ajaxReq.getTransactionData(txData.from, function (data) {
      if (data.error) throw data.msg
      data = data.data
      const rawTx = {
        nonce: ethFuncs.sanitizeHex(data.nonce),
        gasPrice: ethFuncs.sanitizeHex(
          ethFuncs.addTinyMoreToGas(data.gasprice)),
        gasLimit: ethFuncs.sanitizeHex(
          ethFuncs.decimalToHex(txData.gasLimit)),
        to: ethFuncs.sanitizeHex(txData.to),
        value: ethFuncs.sanitizeHex(
          ethFuncs.decimalToHex(etherUnits.toWei(txData.value, txData.unit))),
        data: ethFuncs.sanitizeHex(txData.data)
      }
      const eTx = new Tx(rawTx)

      eTx.sign(new Buffer(txData.key, 'hex'))
      rawTx.rawTx = JSON.stringify(rawTx)
      rawTx.signedTx = '0x' + eTx.serialize().toString('hex')
      rawTx.isError = false
      if (callback !== undefined) callback(rawTx)
    })
  } catch (e) {
    if (callback !== undefined) {
      callback({
        isError: true,
        error: e
      })
    }
  }
}

export function sendTx (signedTx, additionalData, callback) {
  ajaxReq.sendRawTx(signedTx, additionalData, function (data) {
    let resp = {}
    if (data.error) {
      resp = {
        isError: true,
        error: data.msg
      }
    } else {
      resp = {
        isError: false,
        data: data.data
      }
    }
    if (callback !== undefined) callback(resp)
  })
}
