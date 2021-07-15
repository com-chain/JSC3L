import BigNumber from 'bignumber.js'

import ajaxReq from './ajaxReq'
import { getNakedAddress, padLeft, getDataObj } from './ethFuncs'
import { getContract1, getContract2 } from './jsc3l_customization'

const jsc3l_bcRead = {}

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
  jsc3l_bcRead[key] = function (walletAddress, callback) {
    getAmount(address, walletAddress, callback)
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
  jsc3l_bcRead[key] = function (walletAddress, callback) {
    getAccInfo(address, walletAddress, callback)
  }
}

// Get Global infos: Tax destinary Account
jsc3l_bcRead.getTaxAccount = function (callback) {
  const taxAccountAddress = '0x4f2eabe0'
  getGlobInfo(taxAccountAddress, callback)
}

// Get Historical infos infos: Global balance
jsc3l_bcRead.getHistoricalGlobalBalance = function (
  walletAddress, blockNb, callback) {
  const globalBalance = '0x70a08231'
  getAmountAt(globalBalance, walletAddress, blockNb, callback)
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
  jsc3l_bcRead[`get${key}List`] = function (
    walletAddress, indMin, indMax, callback) {
    getInfo(getContract2(), `0x${configList.count}`, walletAddress,
      function (count) {
        const list = []
        const index = Math.min(count - 1, indMax)
        getElementInList(getContract2(),
        `0x${configList.map}`,
        `0x${configList.amount}`,
        walletAddress,
        index,
        list,
        indMin,
        callback)
      })
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

function getAmount (address, walletAddress, callback) {
  const userInfo = getDataObj(getContract1(), address,
    [getNakedAddress(walletAddress)])
  ajaxReq.getEthCall(userInfo, function (data) {
    if (!data.error) {
      callback(getNumber(data.data, 100.0).toString())
    }
  })
}

function getAccInfo (address, walletAddress, callback) {
  getInfo(getContract1(), address, walletAddress, callback)
}

function getGlobInfo (address, callback) {
  const userInfo = getDataObj(getContract1(), address, [])
  ajaxReq.getEthCall(userInfo, function (data) {
    if (!data.error) {
      callback(data.data)
    }
  })
}

function getAmountAt (address, walletAddress, blockNb, callback) {
  const userInfo = getDataObj(getContract1(), address,
    [getNakedAddress(walletAddress)])
  const blockHex = '0x' + new BigNumber(blockNb).toString(16)
  ajaxReq.getEthCallAt(userInfo, blockHex, function (data) {
    if (!data.error && data.data) {
      callback(getNumber(data.data, 100.0).toString())
    } else {
      callback('')
    }
  })
}

function getInfo (contract, address, walletAddress, callback) {
  const userInfo = getDataObj(contract, address,
    [getNakedAddress(walletAddress)])
  ajaxReq.getEthCall(userInfo, function (data) {
    if (!data.error) {
      callback(getNumber(data.data, 1.0))
    }
  })
}

function getAmountForElement (contract, functionAddress,
  callerAddress, elementAddress, callback) {
  const userInfo = getDataObj(contract, functionAddress,
    [getNakedAddress(callerAddress), getNakedAddress(elementAddress)])
  ajaxReq.getEthCall(userInfo, function (data) {
    if (!data.error) {
      callback(getNumber(data.data, 100.0).toString())
    }
  })
}

function getElementInList (contract, mapFunctionAddress,
  amountFunctionAddress, callerAddress, index, list, indMin, callback) {
  if (index >= indMin) {
    const userInfo = getDataObj(contract, mapFunctionAddress,
      [getNakedAddress(callerAddress),
        padLeft(new BigNumber(index).toString(16), 64)])
    ajaxReq.getEthCall(userInfo, function (data) {
      if (!data.error) {
        getAmountForElement(contract, amountFunctionAddress,
          callerAddress, data.data, function (amount) {
            const cleanedAdd = '0x' + data.data.substring(data.data.length - 40)
            const element = { address: cleanedAdd, amount: amount }
            list.unshift(element)
            getElementInList(contract, mapFunctionAddress,
              amountFunctionAddress, callerAddress, index - 1, list,
              indMin, callback)
          })
      }
    })
  } else {
    callback(list)
  }
}

export default jsc3l_bcRead
