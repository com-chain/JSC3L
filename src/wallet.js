import ajaxReq from './rest/ajaxReq'
import Wallet from './ethereum/myetherwallet'
import { getCurencyName, getUnlockUrl } from './customization'

import * as message from './message'

const scrypt = {
  n: 1024
}
const kdf = 'scrypt'

export async function createWallet () {
  const wallet = Wallet.generate(false)
  return message.ensureWalletMessageKey(wallet, '')
}

export function encryptWallet (wallet, password) {
  return wallet.toV3(password, {
    kdf: kdf,
    n: scrypt.n,
    server_name: getCurencyName(),
    message_key: wallet.message_key
  })
}

export function validateEnrollment (codeId, signature) {
  return ajaxReq.validateEnrollmentLetter(codeId,
    getCurencyName(),
    signature)
}

export function enrollAddress (wallet, codeId, token) {
  return ajaxReq.enrollAddress(codeId,
    wallet.getAddressString(),
    getCurencyName(),
    token)
}

export function requestUnlock (wallet) {
  return ajaxReq.requestUnlock(wallet.getAddressString(),
    getUnlockUrl())
}
