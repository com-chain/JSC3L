import { cipherMsg, decipherMsg } from './ethereum/cipher'


// Used in the test
export function getMyTransactionMemo (msgWallet, transaction) {
  const key = msgWallet.messageKeysFromWallet()
  const watchedAddress = msgWallet.getAddressString().toLowerCase()
  const { addr_to, message_to, addr_from, message_from } = transaction

  return getTransactionMemo(transaction, watchedAddress, key)
}


export function getTransactionMemo (transaction, forAddress, messageKey) {
  const { addr_to, message_to, addr_from, message_from } = transaction

  if (addr_to.toLowerCase() === forAddress && message_to) {
    return decipherMsg(messageKey, message_to)
  }

  if (addr_from.toLowerCase() === forAddress && message_from) {
    return decipherMsg(messageKey, message_from)
  }

  return ''
}


export function getTxMemoCipheredData (fromMsgKey, toMsgKey, msgFrom, msgTo) {
  return {
    ...(fromMsgKey && msgFrom) &&
      { memo_from: cipherMsg(fromMsgKey, msgFrom) },
    ...(toMsgKey && msgTo) &&
      { memo_to: cipherMsg(toMsgKey, msgTo) },
  }
}

