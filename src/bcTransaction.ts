
import { getNakedAddress, padLeft, encodeNumber } from './ethereum/ethFuncs'
import { generateTx } from './ethereum/uiFuncs'
import AjaxReq from './rest/ajaxReq'


function roundCent (strAmount:string) {
  return Math.round(100 * parseFloat(strAmount))
}


function typeConv (label: string): (x:any) => (string | number) {
  if (label.endsWith('Address')) {
    return (a) => padLeft(getNakedAddress(a), 64)
  }
  if (label.startsWith('limit') || label === 'amount') {
    return (nb) => encodeNumber(roundCent(nb))
  }
  if (label.endsWith('Status') || label.endsWith('Type')) {
    return (nb) => encodeNumber(nb)
  }
  if (label === 'status') {
    return (nb) => (parseInt(nb, 10) === 0 ? 0 : 1)
  }
  throw new Error(`Unexpected label '${label}' in FnDefs.`)
}


export default abstract class BcTransactionAbstract {

  abstract ajaxReq: AjaxReq
  abstract contracts: string[]

  // //////////////////////////////////////////////////////////////////////////
  //  CM VS Nant Handling

  getSplitting (nantVal, cmVal, cmMinusLim, amount) {
    cmVal = parseFloat(cmVal)
    nantVal = parseFloat(nantVal)
    let nant = 0
    let cm = 0

    let res = parseFloat(amount)
    if (cmVal > 0) {
      if (cmVal >= res) {
        cm = res
        res = 0
      } else {
        cm = cmVal
        res = res - cmVal
        cmVal = 0
      }
    }

    if (nantVal > 0) {
      if (nantVal >= res) {
        nant = res
        res = 0
      } else {
        nant = nantVal
        res = res - nantVal
        // nantVal=0;
      }
    }

    if (res > 0 && cmVal - parseFloat(cmMinusLim) >= res) {
      cm = cm + res
      res = 0
    }

    const possible = res === 0
    return { possible: possible, nant: nant, cm: cm }
  }

  // //////////////////////////////////////////////////////////////////////////

}




[
  // First Contract
  {
    setAccountParam: '848b2592:accAddress accStatus accType limitPlus limitMinus',
    pledgeAccount: '6c343eef:accAddress amount *',
    setAllowance: 'd4e12f2e:spenderAddress amount',
    setDelegation: '75741c79:spenderAddress limit',
    setTaxAmount: 'f6f1897d:amount',
    setTaxLegAmount: 'fafaf4c0:amount',
    setTaxAccount: 'd0385b5e:accAddress',
    setOwnerAccount: 'f2fde38b:accAddress',
    setContractStatus: '0x88b8084f:status',
  },
  // Second Contract
  {
    transferNant: 'a5f7c148:toAddress amount *',
    transferCM: '60ca9c4c:toAddress amount *',
    transferOnBehalfNant: '1b6b1ee5:fromAddress toAddress amount D',
    transferOnBehalfCM: '74c421fe:fromAddress toAddress amount D',
    askTransferFrom: '58258353:fromAddress amount',
    askTransferCMFrom: '2ef9ade2:fromAddress amount',
    payRequestNant: '132019f4:toAddress amount *',
    payRequestCM: '1415707c:toAddress amount *',
    rejectRequest: 'af98f757:toAddress',
    dissmissAcceptedInfo: 'ccf93c7a:accAddress',
    dissmissRejectedInfo: '88759215:accAddress',
  }
].forEach((contractFnDefs, contractNb) => {

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

    BcTransactionAbstract.prototype[fnName] = async function (wallet, ...args) {
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
      const rawTx = generateTx({
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
      if (rawTx.isError) return rawTx
      return this.ajaxReq.sendTx(rawTx.signedTx, additionalPostData)
    }
  }
})