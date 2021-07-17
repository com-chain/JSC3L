
import { getNakedAddress, padLeft, encodeNumber } from './ethereum/ethFuncs'
import { generateTx, sendTx } from './ethereum/uiFuncs'

import { getContract1, getContract2 } from './customization'

/* Action in Contract 1 */
export function SetAccountParam (wallet, accountAddress, accStatus,
  accType, limitMinus, limitPlus) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  return internalGenTx(getContract1(),
    wallet,
    '0x848b2592',
    [accAdd,
      encodeNumber(accStatus),
      encodeNumber(accType),
      encodeNumber(parseInt(100 * limitPlus, 10)),
      encodeNumber(parseInt(100 * limitMinus, 10))],
    {})
}

export function PledgeAccount (wallet, accountAddress, amount,
  additionalPostData) {
  const amountCent = encodeNumber(parseInt(100 * amount, 10))
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  return internalGenTx(getContract1(),
    wallet,
    '0x6c343eef',
    [accAdd, amountCent],
    additionalPostData)
}

export function setAllowance (wallet, spenderAddress, amount) {
  const accAdd = padLeft(getNakedAddress(spenderAddress), 64)
  return internalGenTx(getContract1(),
    wallet,
    '0xd4e12f2e',
    [accAdd, encodeNumber(parseInt(100 * amount, 10))],
    {})
}

export function setDelegation (wallet, spenderAddress, limit) {
  const accAdd = padLeft(getNakedAddress(spenderAddress), 64)
  return internalGenTx(getContract1(),
    wallet,
    '0x75741c79',
    [accAdd, encodeNumber(parseInt(100 * limit, 10))],
    {})
}

export function SetTaxAmount (wallet, amount) {
  return internalGenTx(getContract1(),
    wallet,
    '0xf6f1897d',
    [encodeNumber(parseInt(amount, 10))],
    {})
}

export function SetTaxLegAmount (wallet, amount) {
  return internalGenTx(getContract1(),
    wallet,
    '0xfafaf4c0',
    [encodeNumber(parseInt(amount, 10))],
    {})
}

export function SetTaxAccount (wallet, accountAddress) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  return internalGenTx(getContract1(),
    wallet,
    '0xd0385b5e',
    [accAdd],
    {})
}

export function SetOwnerAccount (wallet, accountAddress) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  return internalGenTx(getContract1(),
    wallet,
    '0xf2fde38b',
    [accAdd],
    {})
}

// if set to 0 block all the transferts
export function SetContractStatus (wallet, status) {
  let value = parseInt(status, 10)
  if (value !== 0) value = 1
  return internalGenTx(getContract1(),
    wallet,
    '0x88b8084f',
    [encodeNumber(value)],
    {})
}

/* Action in contract 2 */
export function TransferNant (wallet, toAddress, amount,
  additionalPostData) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0xa5f7c148',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData)
}

export function TransferCM (wallet, toAddress, amount,
  additionalPostData) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x60ca9c4c',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData)
}

export function TransferOnBehalfNant (wallet, fromAddress,
  toAddress, amount, additionalPostData) {
  additionalPostData.delegate = wallet.getAddressString()
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x1b6b1ee5',
    [fromAdd, toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData)
}

export function TransferOnBehalfCM (wallet, fromAddress,
  toAddress, amount, additionalPostData) {
  additionalPostData.delegate = wallet.getAddressString()
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x74c421fe',
    [fromAdd, toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalPostData)
}

export function askTransferFrom (wallet, fromAddress, amount) {
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x58258353',
    [fromAdd, encodeNumber(parseInt(100 * amount, 10))],
    {})
}

export function askTransferCMFrom (wallet, fromAddress, amount) {
  const fromAdd = padLeft(getNakedAddress(fromAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x2ef9ade2',
    [fromAdd, encodeNumber(parseInt(100 * amount, 10))],
    {})
}

export function PayRequestNant (wallet, toAddress, amount,
  additionalData) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x132019f4',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalData)
}

export function PayRequestCM (wallet, toAddress, amount,
  additionalData) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x1415707c',
    [toAdd, encodeNumber(parseInt(100 * amount, 10))],
    additionalData)
}

export function RejectRequest (wallet, toAddress) {
  const toAdd = padLeft(getNakedAddress(toAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0xaf98f757',
    [toAdd],
    {})
}

export function DissmissAcceptedInfo (wallet, accountAddress) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0xccf93c7a',
    [accAdd],
    {})
}

export function DissmissRejectedInfo (wallet, accountAddress) {
  const accAdd = padLeft(getNakedAddress(accountAddress), 64)
  return internalGenTx(getContract2(),
    wallet,
    '0x88759215',
    [accAdd],
    {})
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

export async function internalGenTx (contract, wallet, fuctAddress,
  values, additionalPostData) {
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
  const rawTx = await generateTx(tx)
  if (rawTx.isError) return rawTx
  return sendTx(rawTx.signedTx, additionalPostData)
}
