
import ajaxReq from './rest/ajaxReq'
import * as cipher from './ethereum/cipher'

/// ///////////////////////////////////////////////////////////

// NOT EXPOSED

function publishMessageKey (wallet) {
  const dataStr = JSON.stringify({
    address: wallet.getAddressString(),
    public_message_key: wallet.message_key.pub,
    private_message_key: wallet.message_key.priv
  })

  return ajaxReq.publishMessageKey(dataStr, wallet.signMessage(dataStr))
}

/// ///////////////////////////////////////////////////////////
export function getMessageKey (address, withPrivate) {
  return ajaxReq.getMessageKey(address, withPrivate)
}

export async function ensureWalletMessageKey (wallet, message) {
  let remoteKey = await getMessageKey(wallet.getAddressString(), true)
  const walletMessageKey = wallet?.message_key
  if (remoteKey.public_message_key !== undefined) {
    if (message !== '') {
      if (walletMessageKey?.pub !== remoteKey.public_message_key) {
      // TODO: need to remove alerts
        alert(message)
      }
      // Remote but no matching local
    }

    remoteKey = {
      pub: remoteKey.public_message_key,
      priv: remoteKey.private_message_key
    }
  } else {
    if (walletMessageKey?.pub === undefined ||
        walletMessageKey?.priv === undefined) {
      // TODO: need to remove alerts
      if (message !== '') alert(message)
      wallet.message_key = cipher.newMessageKey(wallet)
    }

    // No remote: publish the local key
    remoteKey = wallet.message_key
    publishMessageKey(wallet)
  }

  wallet.message_key = remoteKey
  return wallet
}

export function messageKeysFromWallet (wallet) {
  return messageKeysFromCrypted(wallet, wallet.message_key.priv)
}

function shortenAddress (address) {
  if (address.toLowerCase().substring(0, 2) === '0x') {
    address = address.substr(2)
  }
  return address
}

export function messageKeysFromCrypted (wallet, ciphered) {
  const priv = cipher.Decrypt(wallet.getPrivateKey(), ciphered)
  return { clear_priv: shortenAddress(priv) }
}

export function cipherMessage (publicKey, message) {
  const msgBuff = Buffer.from(message)
  const key = Buffer.from(shortenAddress(publicKey), 'hex')
  return cipher.Encrypt(key, msgBuff)
}

function decipherMessage (privateKey, ciphered) {
  const key = Buffer.from(shortenAddress(privateKey), 'hex')
  return cipher.Decrypt(key, ciphered)
}

export async function publishReqMessages (wallet, addTo, message) {
  const fromMsgKey = (await getMessageKey(wallet.getAddressString(), false))
    .public_message_key
  const toMsgKey = (await getMessageKey(addTo, false)).public_message_key

  const messageFrom = fromMsgKey ? cipherMessage(fromMsgKey, message) : ''
  const messageTo = toMsgKey ? cipherMessage(toMsgKey, message) : ''

  const dataStr = JSON.stringify({
    add_req: wallet.getAddressString(),
    add_cli: addTo,
    ref_req: messageFrom,
    ref_cli: messageTo
  })
  return ajaxReq.publishReqMessages(dataStr, wallet.signMessage(dataStr))
}

export async function getReqMessage (wallet, otherAdd,
  myMessageKey, ISentThisMessage) {
  const addFrom = ISentThisMessage ? wallet.getAddressString() : otherAdd
  const addTo = !ISentThisMessage ? wallet.getAddressString() : otherAdd
  const data = await ajaxReq.getReqMessages(addFrom, addTo)
  if (data === undefined) return ''

  let crypted = ''
  if (ISentThisMessage && data.ref_from !== undefined) {
    crypted = data.ref_from
  } else if (!ISentThisMessage && data.ref_to !== undefined) {
    crypted = data.ref_to
  }

  if (crypted === '') return ''

  try {
    return decipherMessage(myMessageKey, crypted)
  } catch (e) {
    return ''
  }
}

//
// Memo
//


export function getMyTransactionMemo (wallet, transaction) {
  const key = messageKeysFromCrypted(wallet, wallet.message_key.priv).clear_priv
  const watchedAddress = wallet.getAddressString().toLowerCase()
  const { addr_to, message_to, addr_from, message_from } = transaction

  return getTransactionMemo(transaction, watchedAddress, key)
}

export function getTransactionMemo (transaction, watchedAddress, messageKey) {
  const { addr_to, message_to, addr_from, message_from } = transaction

  if (addr_to.toLowerCase() === watchedAddress && message_to) {
    return decipherMessage(messageKey, message_to)
  }

  if (addr_from.toLowerCase() === watchedAddress && message_from) {
    return decipherMessage(messageKey, message_from)
  }

  return ''
}


