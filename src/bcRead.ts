import BigNumber from 'bignumber.js'

import AjaxReq from './rest/ajaxReq'
import { getNakedAddress, padLeft, getDataObj } from './ethereum/ethFuncs'



function decodeData (abiType: string, data: string): any {
  if (data.startsWith('0x')) {
    data = data.slice(2)
  }
  if (data.length === 0) {
    return null
  }
  let dataBuffer: Buffer
  try {
    dataBuffer = Buffer.from(data, 'hex')
  } catch (e) {
    throw new Error(
      'Invalid data provided: not an hex string')
  }
  if (dataBuffer.length % 32 !== 0) {
    throw new Error(
      'Invalid data provided: data length is not a multiple of 32')
  }
  const uintData = dataBuffer.readUIntBE(0, 32)
  switch (abiType) {
    case 'string':
      const dataLocation = uintData
      if (dataLocation % 32 !== 0) {
        throw new Error(
          'Invalid data provided while decoding string: ' +
            'first 32byte word is not a valid address')
      }
      if (dataLocation + 64 > dataBuffer.length) {
        throw new Error(
          'Invalid data provided while decoding string: ' +
            'not enough data to decode length and first word at given location')
      }
      const dataLength = dataBuffer.readUIntBE(dataLocation, 32)
      const expectedLength = Math.ceil((dataLocation + 32 + dataLength) / 32) * 32
      console.log("expected:", expectedLength)
      if (dataBuffer.length !== expectedLength) {
        throw new Error(
          'Invalid data provided while decoding string: ' +
            'not enough data to decode advertised string')
      }
      const dataValue = dataBuffer.slice(dataLocation + 32, dataLocation + 32 + dataLength)
      return dataValue.toString()
    case 'uint':
    case 'uint256':
      return uintData
    case 'number/100':
      return (decodeData('number', data) / 100.0).toString()
    case 'number':
      const shortData = '0x' + data.slice(-12)
      let a = parseInt(shortData, 16)

      if (a > (34359738368 * 4096)) {
        a -= 68719476736 * 4096
      }

      return a
    case 'bool':
      return uintData === 1
    default:
      throw new Error(`Unsupported ABI type: ${abiType}`)
  }
}

/* @skip-prod-transpilation */
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe('decode amounts', () => {
    it('should decode "0x00...0001" to "0.01"', () => {
      expect(decodeData('number/100', '0x0000000000000000000000000000000000000000000000000000000000000001'))
        .toBe('0.01')
    });
    it('should decode "0x00...0010" to "0.16"', () => {
      expect(decodeData('number/100', '0x0000000000000000000000000000000000000000000000000000000000000010'))
        .toBe('0.16')
    });
    it('should decode "0x00...1000" to "40.96"', () => {
      expect(decodeData('number/100', '0x0000000000000000000000000000000000000000000000000000000000001000'))
        .toBe('40.96')
    });
    it('should decode 0x00...01_0000_0000_0001 to "0.01" (ignore bytes > 6)', () => {
      expect(decodeData('number/100', '0x0000000000000000000000000000000000000000000000000001000000000001'))
        .toBe('0.01')
    });
    it('should decode 0x00...00_8000_0000_0000 to "1407374883553.28" (max positive number)', () => {
      expect(decodeData('number/100', '0x0000000000000000000000000000000000000000000000000000800000000000'))
        .toBe('1407374883553.28')
    });
    it('should decode 0x00...00_8000_0000_0001 to "-1407374883553.27" (max negative number)', () => {
      expect(decodeData('number/100', '0x0000000000000000000000000000000000000000000000000000800000000001'))
        .toBe('-1407374883553.27')
    });
    it('should decode 0x00...00_8fffffffffff to "-0.01" (max negative number)', () => {
      expect(decodeData('number/100', '0x0000000000000000000000000000000000000000000000000000ffffffffffff'))
        .toBe('-0.01')
    });
  });
  describe('decode strings', () => {
    it('should decode "0x00...020_0...0_" to "2.0" (enforce 2 digit after floating point)', () => {
      expect(decodeData(
        'string', '0x' +
          '0000000000000000000000000000000000000000000000000000000000000020' + // data location
          '0000000000000000000000000000000000000000000000000000000000000003' + // data length
          '322e300000000000000000000000000000000000000000000000000000000000'   // actual string
      )).toBe('2.0')
    })
  })
}

export default abstract class BcReadAbstract {

  abstract ajaxReq: AjaxReq
  abstract contracts: string[]

  // Get Global status of the contract
  getContractStatus () { return this.read(this.contracts[0], '0x8b3c7c69') }
  // Get Global infos: Tax destinary Account
  getTaxAccount () { return this.read(this.contracts[0], '0x4f2eabe0') }

  // Get Historical infos infos: Global balance
  async getHistoricalGlobalBalance (walletAddress, blockNb) {
    const data = await this.read(
      this.contracts[0], '0x70a08231', [
        getNakedAddress(walletAddress)
      ], blockNb)
    return decodeData('number/100', data)
  }

  async getVersion () {
    const data = await this.read(this.contracts[0], '0x54fd4d50')
    return decodeData('string', data as string)
  }


  // //////////////////////////////////////////////////////////////////////////
  // Generic read function

  async getAmount (address, walletAddress) {
    const data = await this.read(
      this.contracts[0], address, [
        getNakedAddress(walletAddress)
      ])
    return decodeData('number/100', data)
  }

  async getAccInfo (address, walletAddress) {
    const data = await this.read(
      this.contracts[0], address, [
        getNakedAddress(walletAddress)
      ])
    return decodeData('number', data)
  }

  async read (contract: string, address: string, args?: any[],
              blockNb: string | number = 'pending'): Promise<string> {
    args = args || []
    const ethCall = getDataObj(contract, address, args)
    if (typeof blockNb !== 'string') {
      blockNb = '0x' + new BigNumber(blockNb).toString(16)
    }
    try {
      return (await this.ajaxReq.getEthCallAt(ethCall, blockNb)) as string
    } catch (e) {
      throw new Error(
        `Failed read contract: ${contract}, fn: ${address}`
      )
    }
  }

  async getAmountForElement (
    contract, functionAddress, callerAddress, elementAddress) {
    const data = await this.read(
      contract, functionAddress, [
        getNakedAddress(callerAddress),
        getNakedAddress(elementAddress)
      ])
    return decodeData('number/100', data)
  }

  async getElementInList (
    contract, mapFunctionAddress, amountFunctionAddress,
    callerAddress, index, list, indMin) {

    if (index < indMin) return list

    const data = await this.read(
      contract, mapFunctionAddress, [
        getNakedAddress(callerAddress),
        padLeft(new BigNumber(index).toString(16), 64)
      ])
    const amount = await this.getAmountForElement(
      contract, amountFunctionAddress, callerAddress, data)

    const address = '0x' + data.substring(data.length - 40)
    const element = { address, amount }
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
      // Simple protection against ill inputs on indMin and indMax and to
      // avoid unwanted infinite loops
      indMax = indMax || 0
      indMin = indMin || 0
      const data = await this.read(
        this.contracts[1], `0x${configList.count}`, [
          getNakedAddress(walletAddress)
        ])
      const count = decodeData('number', data)
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

