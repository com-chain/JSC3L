import ethUtil from 'ethereumjs-util'

export function signMessage (wallet, msg) {
  const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(msg))
  const signature = ethUtil.ecsign(msgHash, wallet.getPrivateKey())
  return ethUtil.bufferToHex(
    Buffer.concat([signature.r, signature.s, ethUtil.toBuffer(signature.v)]))
}
