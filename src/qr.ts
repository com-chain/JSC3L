import ethUtil from 'ethereumjs-util'



type Signature = {
  v: string,
  r: string,
  s: string,
}

type QRDataRaw = {
  address: string,
  destinary: string,
  begin: string,
  end: string,
  viewbalance: boolean,
  viewoldtran: boolean,
  message_key?: string,
}

type QRData = {
  address: string,
  destinary: string,
  begin: Date,
  end: Date,
  viewbalance: boolean,
  viewoldtran: boolean,
  message_key?: string,
}


export type SignedQR = {data: QRDataRaw, signature: Signature}


export function checkSignedQR (qrContent: SignedQR, intendedRecipientAddress) {

  let hash: string
  let publicSignKey: string
  let receiverAddress: string
  const { data, signature } = qrContent
  try {
    hash = ethUtil.sha3(JSON.stringify(data))
    publicSignKey = ethUtil.ecrecover(
      hash, signature.v, signature.r, signature.s)
    receiverAddress = ethUtil.bufferToHex(
      ethUtil.publicToAddress(publicSignKey))
  } catch (e) {
    // XXXVlab: should probably use exceptions
    return 'InvalidFormat'
  }

  if (receiverAddress !== data.address) {
    return 'InvalidSignature'
  }
  if (data.destinary !== intendedRecipientAddress) {
    return 'NotForYou'
  }
  if ((new Date(data.end)).getTime() < (new Date()).getTime()) {
    return 'Expired'
  }
  return true
}


export function makeSignedQRFragments (
  qrContent: SignedQR,
  fragmentCount: number
) {

  const signatureId = qrContent.signature.s.substring(4, 8)

  const qrString = JSON.stringify(qrContent)
  const fragmentSize = Math.ceil(qrString.length / fragmentCount)
  const fragments = {
    full: qrString,
  }

  for (let i = 0; i < fragmentCount; i++) {
    fragments[i] = `FRAG_CR${signatureId}${i}${qrString.substring(
      fragmentSize * i,
      Math.min(fragmentSize * (i + 1), qrString.length)
    )}`
  }

  return fragments
}


export function makeSignedQRContent (obj: QRData, privKey: string): SignedQR {
  const { begin, end } = obj
  const formatDate = (date: Date) =>
    `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`
  const data = Object.assign(obj, {
    begin: formatDate(begin),
    end: formatDate(end),
  })

  const hash = ethUtil.sha3(JSON.stringify(data))
  const { v, r, s } = ethUtil.ecsign(hash, privKey)
  const signature = {
    v,
    r: '0x' + r.toString('hex'),
    s: '0x' + s.toString('hex'),
  }

  return { data, signature }

}
