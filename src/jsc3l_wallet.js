import ajaxReq from './ajaxReq'
import Wallet from './myetherwallet'
import jsc3l_customization from './jsc3l_customization'

import * as jsc3l_message from './jsc3l_message'

const scrypt = {
  n: 1024
}
const kdf = 'scrypt'

export async function createWallet () {
  const wallet = Wallet.generate(false)
  return jsc3l_message.ensureWalletMessageKey(wallet, '')
}

export function encryptWallet (wallet, password) {
  return wallet.toV3(password, {
    kdf: kdf,
    n: scrypt.n,
    server_name: jsc3l_customization.getCurencyName(),
    message_key: wallet.message_key
  })
}

export function validateEnrollment (codeId, signature) {
  return ajaxReq.validateEnrollmentLetter(codeId,
    jsc3l_customization.getCurencyName(),
    signature)
}

export function enrollAddress (wallet, codeId, token) {
  return ajaxReq.enrollAddress(codeId,
    wallet.getAddressString(),
    jsc3l_customization.getCurencyName(),
    token)
}

export function requestUnlock (wallet) {
  return ajaxReq.requestUnlock(wallet.getAddressString(),
    jsc3l_customization.getUnlockUrl())
}
