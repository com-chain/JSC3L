
import { getNakedAddress, padLeft, encodeNumber } from './ethereum/ethFuncs'
import { generateTx } from './ethereum/uiFuncs'
import AjaxReq from './rest/ajaxReq'
import * as utils from './utils'

function roundCent (strAmount:string) {
  return Math.round(100 * parseFloat(strAmount))
}


function typeConv (label: string): (x:any) => (string | number) {
  if (label.endsWith('Address')) {
    return (a) => padLeft(getNakedAddress(a), 64)
  }
  if (label === 'int') {
    return (nb) => encodeNumber(parseInt(nb, 19))
  }
  if (label.startsWith('limit') || label === 'amount') {
    return (nb) => encodeNumber(roundCent(nb))
  }
  if (label.endsWith('Status') || label.endsWith('Type') || label.endsWith('Int')) {
    return (nb) => encodeNumber(nb)
  }
  if (label.endsWith('Hex')) {
    return (s) => s.padEnd(128, '0')
  }
  if (label === 'status') {
    return (nb) => encodeNumber(parseInt(nb, 10) === 0 ? 0 : 1)
  }
  throw new Error(`Unexpected label '${label}' in FnDefs.`)
}


export abstract class BcTransactionAbstract {

  abstract ajaxReq: AjaxReq
  abstract contracts: string[]

  // //////////////////////////////////////////////////////////////////////////
  //  CM VS Nant Handling

  static getSplitting (nantBal, cmBal, cmSrcMin, amount) {
    console.warn("Obsolete usage of `BcTransactionAbstract.getSplitting()'," +
                 " prefer `jsc3l.utils.getSplitting()'")
    cmBal = parseFloat(cmBal)
    nantBal = parseFloat(nantBal)
    amount = parseFloat(amount)
    cmSrcMin = parseFloat(cmSrcMin)

    try {
      let {nant, cm} = utils.getSplitting(amount, { cm: cmBal, nant: nantBal}, cmSrcMin)
      return { possible: true, nant, cm}
    } catch(e: any) {
      return { possible: false}
    }
  }
  getSplitting = BcTransactionAbstract.getSplitting

}

/* @skip-prod-transpilation */
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe('split', () => {
    it('should split 0 to cm: 0, nant: 0', () => {
      expect(BcTransactionAbstract.getSplitting(0, 0, 0, 0))
        .toStrictEqual({ possible: true, nant: 0, cm: 0})
    });
    it('should NOT split 1 with no funds', () => {
      expect(BcTransactionAbstract.getSplitting(0, 0, 0, 1).possible)
        .toBe(false)
    });
    // Only Cm
    it('should split 1 to cm: 1, nant: 0 with bal cm: 2, nant: 0', () => {
      expect(BcTransactionAbstract.getSplitting(0, 2, 0, 1))
        .toStrictEqual({ possible: true, nant: 0, cm: 1})
    });
    it('should split 2 to cm: 2, nant: 0 with bal cm: 2, nant: 0', () => {
      expect(BcTransactionAbstract.getSplitting(0, 2, 0, 2))
        .toStrictEqual({ possible: true, nant: 0, cm: 2})
    });
    it('should NOT split 3 with bal cm: 2, nant: 0', () => {
      expect(BcTransactionAbstract.getSplitting(0, 2, 0, 3).possible)
        .toBe(false)
    });
    // Only Nant
    it('should split 1 to cm: 0, nant: 1 with bal cm: 0, nant: 2', () => {
      expect(BcTransactionAbstract.getSplitting(2, 0, 0, 1))
        .toStrictEqual({ possible: true, nant: 1, cm: 0})
    });
    it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2', () => {
      expect(BcTransactionAbstract.getSplitting(2, 0, 0, 2))
        .toStrictEqual({ possible: true, nant: 2, cm: 0})
    });
    it('should NOT split 3 with bal cm: 0, nant: 2', () => {
      expect(BcTransactionAbstract.getSplitting(2, 0, 0, 3).possible)
        .toBe(false)
    });
    // Both Nant and Cm
    it('should split 2 to cm: 1, nant: 1 with bal cm: 1, nant: 1', () => {
      expect(BcTransactionAbstract.getSplitting(1, 1, 0, 2))
        .toStrictEqual({ possible: true, nant: 1, cm: 1})
    });
    it('should split 2 to cm: 0, nant: 2 with bal cm: 0, nant: 2 (limSrcCm: -2)', () => {
      expect(BcTransactionAbstract.getSplitting(2, 0, -2, 2))
        .toStrictEqual({ possible: true, nant: 2, cm: 0})
    });
    it('should split 2 to cm: 1, nant: 1 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
      expect(BcTransactionAbstract.getSplitting(1, 0, -1, 2))
        .toStrictEqual({ possible: true, nant: 1, cm: 1})
    });
    it('should NOT split 3 with bal cm: 0, nant: 1 (limSrcCm: -1)', () => {
      expect(BcTransactionAbstract.getSplitting(1, 0, -1, 3).possible)
        .toBe(false)
    });
    it('should split 3 to cm: 2, nant: 1 with bal cm: 1, nant: 1 (limSrcCm: -1)', () => {
      expect(BcTransactionAbstract.getSplitting(1, 1, -1, 3))
        .toStrictEqual({ possible: true, nant: 1, cm: 2})
    });
    // Negative cm bal and limSrcCm
    it('should split 1 to cm: -1, nant: 0 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
      expect(BcTransactionAbstract.getSplitting(0, -1, -2, 1))
        .toStrictEqual({ possible: true, nant: 0, cm: 1})
    });
    it('should NOT split 2 with bal cm: -1, nant: 0 (limSrcCm: -2)', () => {
      expect(BcTransactionAbstract.getSplitting(0, -1, -2, 2).possible)
        .toBe(false)
    });

  });
}

export function transactionFactory(transactionDefs: any[], bcTransactionClass: any) {

  transactionDefs.forEach((contractFnDefs, contractNb) => {

    for (const fnName in contractFnDefs) {

      const [fnHash, argStringList] = contractFnDefs[fnName].split(':')
      const argList = argStringList.split(' ')
      let hasAdditionalPostData = false
      let hasDelegate = false
      if (argList.slice(-1)[0] === '*') {
        hasAdditionalPostData = true
        argList.pop()
      } else if (argList.slice(-1)[0] === 'D') {
        hasAdditionalPostData = true
        hasDelegate = true
        argList.pop()
      }

      // Build argument array function
      const argFnList = argList.map((arg) => typeConv(arg))
      const concatArgs = (args) =>
        args.map((arg, idx) => argFnList[idx](arg)).join('')

      bcTransactionClass.prototype[fnName] = async function (wallet, ...args) {
        const addr = wallet.getAddressString()
        const data = await this.ajaxReq.getTransactionData(addr)
        // TODO: must test this
        if (data.error) {
          console.log(`Failed getTransactionData(${addr})`)
          throw new Error(data.msg)
        }
        const additionalPostData = hasAdditionalPostData ? args.pop() : {}
        if (hasDelegate) {
          additionalPostData.delegate = wallet.getAddressString()
        }
        const rawSignedTx = generateTx({
          gasLimit: 500000,
          data: fnHash + concatArgs(args),
          to: this.contracts[contractNb],
          unit: 'ether',
          value: 0,
          nonce: 1,
          gasPrice: null,
          donate: false,
          from: addr,
          key: wallet.getPrivateKeyString()
        }, data)
        return this.ajaxReq.sendTx(rawSignedTx, additionalPostData)
      }
    }
  })
}
