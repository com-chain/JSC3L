import BigNumber from 'bignumber.js'

import ajaxReq from './rest/ajaxReq'
import { getNakedAddress, padLeft, getDataObj } from './ethereum/ethFuncs'
import { getContract1, getContract2 } from './customization'

const bcRead = {}

// Function to read amount of coin
const balanceFunction = {
  getGlobalBalance: '0x70a08231',
  getNantBalance: '0xae261aba',
  getCmBalance: '0xbbc72a17',
  getCmLimitBelow: '0xcc885a65',
  getCmLimitAbove: '0xae7143d6'
}

let key
for (key in balanceFunction) {
  const address = balanceFunction[key]
  bcRead[key] = async function (walletAddress) {
    return getAmount(address, walletAddress)
  }
}

// Function to read Account infos
const accountFunction = {
  getAccountStatus: '0x61242bdd',
  getAccountType: '0xba99af70',
  getIsOwner: '0x2f54bf6e',
  getTaxAmount: '0x98a9cfac',
  getLegTaxAmount: '0x48455399',
  getTotalAmount: '0x18160ddd'
}

for (key in accountFunction) {
  const address = accountFunction[key]
  bcRead[key] = function (walletAddress) {
    return getAccInfo(address, walletAddress)
  }
}

// Get Global infos: Tax destinary Account
bcRead.getTaxAccount = async function () {
  const taxAccountAddress = '0x4f2eabe0'
  return getGlobInfo(taxAccountAddress)
}

// Get Historical infos infos: Global balance
bcRead.getHistoricalGlobalBalance = async function (walletAddress, blockNb) {
  const globalBalance = '0x70a08231'
  return getAmountAt(globalBalance, walletAddress, blockNb)
}

// Handle lists
const ListFunction = {
  Allowance: { count: 'aa7adb3d', map: 'b545b11f', amount: 'dd62ed3e' },

  RequestToApprove: { count: 'debb9d28', map: '726d0a28', amount: '3537d3fa' },
  PendingRequest: { count: '418d0fd4', map: '0becf93f', amount: '09a15e43' },

  Delegation: { count: '58fb5218', map: 'ca40edf1', amount: '046d3307' },
  MyDelegation: { count: '7737784d', map: '49bce08d', amount: 'f24111d2' },

  AcceptedRequest: { count: '8d768f84', map: '59a1921a', amount: '958cde37' },
  RejectedRequest: { count: '20cde8fa', map: '9aa9366e', amount: 'eac9dd4d' }
}

for (key in ListFunction) {
  const configList = ListFunction[key]
  bcRead[`get${key}List`] =
    async function (walletAddress, indMin, indMax) {
      const count = await getInfo(getContract2(),
                                  `0x${configList.count}`,
                                  walletAddress)
      const list = []
      const index = Math.min(count - 1, indMax)
      return getElementInList(
        getContract2(),
      `0x${configList.map}`,
      `0x${configList.amount}`,
      walletAddress,
      index,
      list,
      indMin)
    }
}

// /////////////////////////////////////////////////////////////////////////////
// Generic read function

function getNumber (data, ratio) {
  const shortData = '0x' + data.slice(-12)
  let a = parseInt(shortData, 16)

  if (a > (34359738368 * 4096)) {
    a = a - 68719476736 * 4096
  }

  return a / ratio
}

async function getAmount (address, walletAddress) {
  const userInfo = getDataObj(getContract1(), address,
    [getNakedAddress(walletAddress)])
  const data = await ajaxReq.getEthCall(userInfo)
  // TODO: this should not work, data.data was already extracted
  if (data.error) {
    throw new Error(`Failed getEthCall(${userInfo})`)
  }
  return getNumber(data.data, 100.0).toString()
}

async function getAccInfo (address, walletAddress) {
  return getInfo(getContract1(), address, walletAddress)
}

async function getGlobInfo (address) {
  const userInfo = getDataObj(getContract1(), address, [])
  const data = await ajaxReq.getEthCall(userInfo)
  // TODO: this should not work, data.data was already extracted
  if (data.error) {
    throw new Error(`Failed getEthCall(${userInfo})`)
  }
  return data.data
}

async function getAmountAt (address, walletAddress, blockNb) {
  const userInfo = getDataObj(getContract1(), address,
    [getNakedAddress(walletAddress)])
  const blockHex = '0x' + new BigNumber(blockNb).toString(16)
  const data = await ajaxReq.getEthCallAt(userInfo, blockHex)
  // TODO: this should not work, data.data was already extracted
  if (!data.error && data.data) {
    return getNumber(data.data, 100.0).toString()
  } else {
    return ''
  }
}

async function getInfo (contract, address, walletAddress) {
  const userInfo = getDataObj(contract, address,
    [getNakedAddress(walletAddress)])
  const data = await ajaxReq.getEthCall(userInfo)
  // TODO: this should not work, data.data was already extracted
  if (data.error) {
    throw new Error(`Failed getEthCall(${userInfo})`)
  }
  return getNumber(data.data, 1.0)
}

async function getAmountForElement (contract, functionAddress,
  callerAddress, elementAddress) {
  const userInfo = getDataObj(contract, functionAddress,
    [getNakedAddress(callerAddress), getNakedAddress(elementAddress)])
  const data = await ajaxReq.getEthCall(userInfo)
  // TODO: this should not work, data.data was already extracted
  if (data.error) {
    throw new Error(`Failed getEthCall(${userInfo})`)
  }
  return getNumber(data.data, 100.0).toString()
}

async function getElementInList (contract, mapFunctionAddress,
  amountFunctionAddress, callerAddress, index, list, indMin) {
  if (index < indMin) return list

  const userInfo = getDataObj(contract, mapFunctionAddress,
    [getNakedAddress(callerAddress),
      padLeft(new BigNumber(index).toString(16), 64)])
  const data = await ajaxReq.getEthCall(userInfo)

  // TODO: this should not work, data.data was already extracted
  if (data.error) {
    throw new Error(`Failed getEthCall(${userInfo})`)
  }
  const amount = await getAmountForElement(contract, amountFunctionAddress,
    callerAddress, data.data)

  const cleanedAdd = '0x' + amount.data.substring(data.data.length - 40)
  const element = { address: cleanedAdd, amount: amount }
  list.unshift(element)
  return getElementInList(contract, mapFunctionAddress,
    amountFunctionAddress, callerAddress, index - 1, list,
    indMin)
}

bcRead.getTransList = async function (id, count, offset) {
  return ajaxReq.getTransList(id, count, offset)
}

export default bcRead
