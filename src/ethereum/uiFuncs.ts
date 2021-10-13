import Tx from 'ethereumjs-tx'
import * as ethFuncs from './ethFuncs'
import * as etherUnits from './etherUnits'


function isNumeric (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

function isTxDataValid (txData) {
  if (txData.to !== '0xCONTRACT' &&
      !ethFuncs.validateEtherAddress(txData.to)) {
    throw new Error('ERROR_6')
  } else if (!isNumeric(txData.value) ||
             parseFloat(txData.value) < 0) {
    throw new Error('ERROR_8')
  } else if (!isNumeric(txData.gasLimit) ||
             parseFloat(txData.gasLimit) <= 0) {
    throw new Error('ERROR_9')
  } else if (!ethFuncs.validateHexString(txData.data)) {
    throw new Error('ERROR_10')
  }
  if (txData.to === '0xCONTRACT') txData.to = ''
}

export function generateTx (txData, data) {
  try {
    isTxDataValid(txData)

    const rawTx: {[k: string]: any} = {
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

    eTx.sign(Buffer.from(txData.key, 'hex'))
    rawTx.rawTx = JSON.stringify(rawTx)
    rawTx.signedTx = '0x' + eTx.serialize().toString('hex')
    rawTx.isError = false
    return rawTx
  } catch (e) {
    return {
      isError: true,
      error: e
    }
  }
}

