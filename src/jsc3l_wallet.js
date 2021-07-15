import ajaxReq from './ajaxReq'
import Wallet from './myetherwallet'
import jsc3l_customization from './jsc3l_customization'

import * as jsc3l_message from './jsc3l_message'

const scrypt = {
  n: 1024
}
const kdf = 'scrypt'

export function createWallet (callback) {
  const wallet = Wallet.generate(false)
  jsc3l_message.ensureWalletMessageKey(wallet, '', function (completeWallet) {
    callback(completeWallet)
  })
}

export function encryptWallet (wallet, password) {
  return wallet.toV3(password, {
    kdf: kdf,
    n: scrypt.n,
    server_name: jsc3l_customization.getCurencyName(),
    message_key: wallet.message_key
  })
}

export function validateEnrollment (codeId, signature, callback) {
  ajaxReq.validateEnrollmentLetter(codeId,
    jsc3l_customization.getCurencyName(),
    signature,
    callback
  )
}

export function enrollAddress (wallet, codeId, token, callback) {
  ajaxReq.enrollAddress(codeId,
    wallet.getAddressString(),
    jsc3l_customization.getCurencyName(),
    token,
    function (data) {
      callback(data.result === 'OK')
    })
}

export function requestUnlock (wallet, callback) {
  ajaxReq.requestUnlock(wallet.getAddressString(),
    jsc3l_customization.getUnlockUrl(),
    callback)
}
