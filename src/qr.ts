import ethUtil from 'ethereumjs-util'


export function checkSignedQRFromString (qrString, intendedRecipientAddress) {
  let data:string, signature: string
  try {
    ({ data, signature } = JSON.parse(qrString))
  } catch (e) {
    return 'InvalidFormat'
  }
  return checkSignedQR(data, signature, intendedRecipientAddress)
}

export function checkSignedQR (data, signature, intendedRecipientAddress) {
  let hash: string
  let publicSignKey: string
  let receiverAddress: string
  try {
    hash = ethUtil.sha3(JSON.stringify(data))
    publicSignKey = ethUtil.ecrecover(
      hash, signature.v, signature.r, signature.s)
    receiverAddress = ethUtil.bufferToHex(
      ethUtil.publicToAddress(publicSignKey))
  } catch (e) {
    return 'InvalidFormat'
  }

  if (receiverAddress !== data.address) { return 'InvalidSignature' }
  if (data.destinary !== intendedRecipientAddress) { return 'NotForYou' }
  if ((new Date(data.end)).getTime() < (new Date()).getTime()) {
    return 'Expired'
  }
  return { signature, data }
}
