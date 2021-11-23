import BigNumber from 'bignumber.js'

import AjaxReq from './rest/ajaxReq'
import { getNakedAddress, padLeft, getDataObj } from './ethereum/ethFuncs'


function getNumber (data, ratio) {
  const shortData = '0x' + data.slice(-12)
  let a = parseInt(shortData, 16)

  if (a > (34359738368 * 4096)) {
    a -= 68719476736 * 4096
  }

  return a / ratio
}


export default abstract class BcReadAbstract {

  abstract ajaxReq: AjaxReq
  abstract contracts: string[]

  // Get Global status of the contract
  async getContractStatus () { return this.getGlobInfo('0x8b3c7c69') }
  // Get Global infos: Tax destinary Account
  async getTaxAccount () { return this.getGlobInfo('0x4f2eabe0') }

  // Get Historical infos infos: Global balance
  async getHistoricalGlobalBalance (walletAddress, blockNb) {
    return this.getAmountAt('0x70a08231', walletAddress, blockNb)
  }


  // //////////////////////////////////////////////////////////////////////////
  // Generic read function

  async getAmount (address, walletAddress) {
    const userInfo = getDataObj(
      this.contracts[0], address, [getNakedAddress(walletAddress)])
    const data = await this.ajaxReq.getEthCall(userInfo)
    return getNumber(data, 100.0).toString()
  }

  async getAccInfo (address, walletAddress) {
    return this.getInfo(this.contracts[0], address, walletAddress)
  }

  getGlobInfo (address) {
    const userInfo = getDataObj(this.contracts[0], address, [])
    return this.ajaxReq.getEthCall(userInfo)
  }

  async getAmountAt (address, walletAddress, blockNb) {
    const userInfo = getDataObj(
      this.contracts[0], address, [getNakedAddress(walletAddress)])
    const blockHex = '0x' + new BigNumber(blockNb).toString(16)
    const data = await this.ajaxReq.getEthCallAt(userInfo, blockHex)
    return getNumber(data, 100.0).toString()
  }

  async getInfo (contract, address, walletAddress) {
    const userInfo = getDataObj(
      contract, address, [getNakedAddress(walletAddress)])
    const data = await this.ajaxReq.getEthCall(userInfo)
    return getNumber(data, 1.0)
  }

  async getAmountForElement (
    contract, functionAddress, callerAddress, elementAddress) {
    const userInfo = getDataObj(
      contract, functionAddress,
      [
        getNakedAddress(callerAddress),
        getNakedAddress(elementAddress)
      ])
    const data = await this.ajaxReq.getEthCall(userInfo)
    return getNumber(data, 100.0).toString()
  }

  async getElementInList (
    contract, mapFunctionAddress, amountFunctionAddress,
    callerAddress, index, list, indMin) {

    if (index < indMin) return list

    const userInfo = getDataObj(
      contract, mapFunctionAddress,
      [
        getNakedAddress(callerAddress),
        padLeft(new BigNumber(index).toString(16), 64)
      ])
    const data: {[k: string]: any} = await this.ajaxReq.getEthCall(userInfo)

    const amount = await this.getAmountForElement(
      contract, amountFunctionAddress, callerAddress, data)

    const cleanedAdd = '0x' + data.substring(data.length - 40)
    const element = { address: cleanedAdd, amount: amount }
    list.unshift(element)
    return this.getElementInList(
      contract, mapFunctionAddress,
      amountFunctionAddress, callerAddress, index - 1, list,
      indMin)
  }

}



const fnHashes = [
  {
    fn: 'getAmount',
    hashes: {  // Function to read amount of coin
      getGlobalBalance: '0x70a08231',
      getNantBalance: '0xae261aba',
      getCmBalance: '0xbbc72a17',
      getCmLimitBelow: '0xcc885a65',
      getCmLimitAbove: '0xae7143d6'
    }
  },
  {
    fn: 'getAccInfo',
    hashes: {  // Function to read Account infos
      getAccountStatus: '0x61242bdd',
      getAccountType: '0xba99af70',
      getIsOwner: '0x2f54bf6e',
      getTaxAmount: '0x98a9cfac',
      getLegTaxAmount: '0x48455399',
      getTotalAmount: '0x18160ddd'
    }
  }
]

fnHashes.forEach(({ fn, hashes }) => {
  for (const fnName in hashes) {
    const fnHash = hashes[fnName]
    BcReadAbstract.prototype[fnName] = function (walletAddress) {
      return this[fn](fnHash, walletAddress)
    }
  }
})



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

for (const key in ListFunction) {
  const configList = ListFunction[key]
  BcReadAbstract.prototype[`get${key}List`] =
    async function (walletAddress, indMin, indMax) {
      const count = await this.getInfo(
        this.contracts[1],
        `0x${configList.count}`,
        walletAddress)
      const list = []
      const index = Math.min(count - 1, indMax)
      return this.getElementInList(
        this.contracts[1],
        `0x${configList.map}`,
        `0x${configList.amount}`,
        walletAddress,
        index,
        list,
        indMin)
    }
}

