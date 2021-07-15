
import { getNakedAddress, padLeft, encodeNumber } from './ethFuncs'

import jsc3l_customization from './jsc3l_customization'
import { generateTx, sendTx } from './uiFuncs'

/* Action in Contract 1 */
export function SetAccountParam (wallet, accountAddress, accStatus,
  accType, limitMinus, limitPlus, callback) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0x848b2592',
    [accAdd,
      encodeNumber(accStatus),
      encodeNumber(accType),
      encodeNumber(parseInt(100 * limitPlus, 10)),
      encodeNumber(parseInt(100 * limitMinus, 10))],
    {},
    callback)
}

export function PledgeAccount (wallet, accountAddress, amount,
  additionalPostData, callback) {
  const amountCent = encodeNumber(parseInt(100 * amount, 10))
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0x6c343eef',
    [accAdd, amountCent],
    additionalPostData,
    callback)
}

export function setAllowance (wallet, spenderAddress, amount, callback) {
  const accAdd = padLeft(getNakedAddress(spenderAddress), 64)
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0xd4e12f2e',
    [accAdd, encodeNumber(parseInt(100 * amount, 10))],
    {},
    callback)
}

export function setDelegation (wallet, spenderAddress, limit, callback) {
  const accAdd = padLeft(getNakedAddress(spenderAddress), 64)
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0x75741c79',
    [accAdd, encodeNumber(parseInt(100 * limit, 10))],
    {},
    callback)
}

export function SetTaxAmount (wallet, amount, callback) {
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0xf6f1897d',
    [encodeNumber(parseInt(amount, 10))],
    {},
    callback)
}

export function SetTaxLegAmount (wallet, amount, callback) {
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0xfafaf4c0',
    [encodeNumber(parseInt(amount, 10))],
    {},
    callback)
}

export function SetTaxAccount (wallet, accountAddress, callback) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0xd0385b5e',
    [accAdd],
    {},
    callback)
}

export function SetOwnerAccount (wallet, accountAddress, callback) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract1(),
    wallet,
    '0xf2fde38b',
    [accAdd],
    {},
    callback)
}

/* Action in contract 2 */
export function TransfertNant (wallet, toAddress, amount,
  additionalPostData, callback) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0xa5f7c148',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData,
    callback)
}

export function TransfertCM (wallet, toAddress, amount,
  additionalPostData, callback) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x60ca9c4c',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData,
    callback)
}

export function TransfertOnBehalfNant (wallet, fromAddress,
  toAddress, amount, additionalPostData, callback) {
  additionalPostData.delegate = wallet.getAddressString()
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x1b6b1ee5',
    [fromAdd, toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData,
    callback)
}

export function TransfertOnBehalfCM (wallet, fromAddress,
  toAddress, amount, additionalPostData, callback) {
  additionalPostData.delegate = wallet.getAddressString()
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x74c421fe',
    [fromAdd, toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData,
    callback)
}

export function askTransfertFrom (wallet, accountAddress,
  fromAddress, amount, callback) {
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  // TODO: never used
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x58258353',
    [fromAdd, encodeNumber(parseInt(100 * amount, 10))],
    {},
    callback)
}

export function askTransfertCMFrom (wallet, accountAddress,
  fromAddress, amount, callback) {
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  // TODO: never used
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x2ef9ade2',
    [fromAdd, encodeNumber(parseInt(100 * amount, 10))],
    {},
    callback)
}

export function PayRequestNant (wallet, toAddress, amount,
  additionalData, callback) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x132019f4',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalData,
    callback)
}

export function PayRequestCM (wallet, toAddress, amount,
  additionalData, callback) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x1415707c',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalData,
    callback)
}

export function RejectRequest (wallet, toAddress, callback) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0xaf98f757',
    [toAdd],
    {},
    callback)
}

export function DissmissAcceptedInfo (wallet, accountAddress, callback) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0xccf93c7a',
    [accAdd],
    {},
    callback)
}

export function DissmissRejectedInfo (wallet, accountAddress, callback) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  internalGenTx(jsc3l_customization.getContract2(),
    wallet,
    '0x88759215',
    [accAdd],
    {},
    callback)
}

// /////////////////////////////////////////////////////////////////////////////
//  CM VS Nant Handling

export function getSplitting (nantVal, cmVal, cmMinusLim, amount) {
  let nant = 0
  let cm = 0

  let res = parseFloat(amount)
  if (parseFloat(cmVal) > 0) {
    if (parseFloat(cmVal) >= res) {
      cm = res
      res = 0
    } else {
      cm = parseFloat(cmVal)
      res = res - parseFloat(cmVal)
      cmVal = 0
    }
  }

  if (parseFloat(nantVal) > 0) {
    if (parseFloat(nantVal) >= res) {
      nant = res
      res = 0
    } else {
      nant = parseFloat(nantVal)
      res = res - parseFloat(nantVal)
      // nantVal=0;
    }
  }

  if (res > 0 && parseFloat(cmVal) - parseFloat(cmMinusLim) >= res) {
    cm = cm + res
    res = 0
  }

  const possible = res === 0
  return { possible: possible, nant: nant, cm: cm }
}

// /////////////////////////////////////////////////////////////////////////////

export function internalGenTx (contract, wallet, fuctAddress,
  values, additionalPostData, callback) {
  const tx = {
    gasLimit: 500000,
    data: '',
    to: contract,
    unit: 'ether',
    value: 0,
    nonce: 1,
    gasPrice: null,
    donate: false
  }

  let concatenatedVariable = ''
  for (let index = 0; index < values.length; ++index) {
    const valueHex = values[index]
    concatenatedVariable = concatenatedVariable + valueHex
  }
  tx.data = fuctAddress + concatenatedVariable
  tx.from = wallet.getAddressString()
  tx.key = wallet.getPrivateKeyString()
  generateTx(tx, function (rawTx) {
    if (!rawTx.isError) {
      sendTx(rawTx.signedTx, additionalPostData, function (res) {
        callback(res)
      })
    } else {
      callback(rawTx)
    }
  })
}
