import crypto from 'crypto'
import ethUtil from 'ethereumjs-util'
import { ec as EC } from 'elliptic'

import ajaxReq from './ajaxReq'

const jsc3l_message = function () {
/// Code adapted from https://github.com/LimelabsTech/eth-ecies

  const ec = new EC('secp256k1')

  const AES256CbcEncrypt = function (iv, key, plaintext) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    const firstChunk = cipher.update(plaintext)
    const secondChunk = cipher.final()

    return Buffer.concat([firstChunk, secondChunk])
  }

  const AES256CbcDecrypt = function (iv, key, ciphertext) {
    const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    const firstChunk = cipher.update(ciphertext)
    const secondChunk = cipher.final()

    return Buffer.concat([firstChunk, secondChunk])
  }

  const BufferEqual = function (b1, b2) {
    if (b1.length !== b2.length) {
      return false
    }

    let res = 0
    for (let i = 0; i < b1.length; i++) {
      res |= b1[i] ^ b2[i]
    }

    return res === 0
  }

  const Encrypt = function (publicKey, plaintext) {
  /* DEBUG */
    const private_key = crypto.randomBytes(32)
    const public_key = ethUtil.privateToPublic(private_key)

    /* DEBUG */

    const pubKeyTo = Buffer.from(publicKey)
    const ephemPrivKey = ec.keyFromPrivate(crypto.randomBytes(32))
    const ephemPubKey = ephemPrivKey.getPublic()
    const ephemPubKeyEncoded = Buffer.from(ephemPubKey.encode())

    // Every EC public key begins with the 0x04 prefix before giving
    // the location of the two point on the curve
    const concatenated = Buffer.concat([Buffer.from([0x04]), pubKeyTo])
    const keys = ec.keyFromPublic(concatenated)
    const pub = keys.getPublic()
    const px = ephemPrivKey.derive(pub)
    const hash = crypto.createHash('sha512').update(Buffer.from(px.toArray())).digest()
    const iv = crypto.randomBytes(16)
    const encryptionKey = hash.slice(0, 32)
    const macKey = hash.slice(32)
    const ciphertext = AES256CbcEncrypt(iv, encryptionKey, plaintext)
    const dataToMac = Buffer.concat([iv, ephemPubKeyEncoded, ciphertext])
    const mac = crypto.createHmac('sha256', macKey).update(dataToMac).digest()

    const serializedCiphertext = Buffer.concat([
      iv, // 16 bytes
      ephemPubKeyEncoded, // 65 bytes
      mac, // 32 bytes
      ciphertext
    ])

    return serializedCiphertext.toString('hex')
  }

  const Decrypt = function (privKey, encrypted) {
    const encryptedBuff = Buffer.from(encrypted, 'hex')
    const privKeyBuff = Buffer.from(privKey)

    // Read iv, ephemPubKey, mac, ciphertext from encrypted message

    const iv = encryptedBuff.slice(0, 16)
    const ephemPubKeyEncoded = encryptedBuff.slice(16, 81)
    const mac = encryptedBuff.slice(81, 113)
    const ciphertext = encryptedBuff.slice(113)
    const ephemPubKey = ec.keyFromPublic(ephemPubKeyEncoded).getPublic()

    const px = ec.keyFromPrivate(privKeyBuff).derive(ephemPubKey)
    const hash = crypto.createHash('sha512').update(Buffer.from(px.toArray())).digest()
    const encryptionKey = hash.slice(0, 32)
    const macKey = hash.slice(32)
    const dataToMac = Buffer.concat([iv, ephemPubKeyEncoded, ciphertext])
    const computedMac = crypto.createHmac('sha256', macKey).update(dataToMac).digest()

    // Verify mac
    if (!BufferEqual(computedMac, mac)) {
      throw new Error('MAC mismatch')
    }

    const plaintext = AES256CbcDecrypt(iv, encryptionKey, ciphertext)

    return plaintext.toString()
  }

  /// ///////////////////////////////////////////////////////////

  // NOT EXPOSED
  function newMessageKey (wallet) {
    const new_key = Wallet.generate(false)
    const m_pub = new_key.getPublicKeyString()
    const m_priv = new_key.getPrivateKeyString()
    return { pub: m_pub, priv: Encrypt(wallet.getPublicKey(), m_priv) }
  }

  function publishMessageKey (wallet, callback) {
    const data_obj = {
      address: wallet.getAddressString(),
      public_message_key: wallet.message_key.pub,
      private_message_key: wallet.message_key.priv
    }

    const data_str = JSON.stringify(data_obj)
    const msg = ethUtil.toBuffer(data_str)
	    const msgHash = ethUtil.hashPersonalMessage(msg)
	    const signature = ethUtil.ecsign(msgHash, wallet.getPrivateKey())
    const sign = ethUtil.bufferToHex(Buffer.concat([signature.r, signature.s, ethUtil.toBuffer(signature.v)]))

    ajaxReq.publishMessageKey(data_str, sign, function (data) { callback(data) })
  }

  /// ///////////////////////////////////////////////////////////
  function getMessageKey (address, with_private, callback) {
    ajaxReq.getMessageKey(address, with_private, callback)
  }

  function ensureWalletMessageKey (wallet, message, callback) {
    getMessageKey(wallet.getAddressString(), true, function (remote_key) {
      if (remote_key.public_message_key !== undefined) {
        if (message != '') {
          if (wallet.message_key === undefined || wallet.message_key.pub === undefined || wallet.message_key.pub != remote_key.public_message_key) {
            alert(message)
          }

          // Remote but no matching local
        }

        remote_key = { pub: remote_key.public_message_key, priv: remote_key.private_message_key }
      } else {
        if (wallet.message_key === undefined || wallet.message_key.pub === undefined || wallet.message_key.priv === undefined) {
          if (message != '') {
            alert(message)
          }
          wallet.message_key = newMessageKey(wallet)
        }

        // No remote: publish the local key
        remote_key = wallet.message_key
        publishMessageKey(wallet, function (data) {})
      }

      wallet.message_key = remote_key
      callback(wallet)
    })
  }

  function messageKeysFromWallet (wallet) {
    return messageKeysFromCrypted(wallet, wallet.message_key.priv)
  }

  function messageKeysFromCrypted (wallet, ciphered) {
    let priv = Decrypt(wallet.getPrivateKey(), ciphered)
    if (priv.toLowerCase().substring(0, 2) == '0x') {
      priv = priv.substr(2)
    }
    return { clear_priv: priv }
  }

  function cipherMessage (public_key, message) {
    const msg_buff = Buffer.from(message)
    if (public_key.toLowerCase().substring(0, 2) == '0x') {
      public_key = public_key.substr(2)
    }

    const key = Buffer.from(public_key, 'hex')
    return Encrypt(key, msg_buff)
  }

  function decipherMessage (private_key, ciphered) {
    if (private_key.toLowerCase().substring(0, 2) == '0x') {
      private_key = priv.substr(2)
    }
    const key = Buffer.from(private_key, 'hex')
    return Decrypt(key, ciphered)
  }

  function publishReqMessages (wallet, add_to, message, callback) {
    getMessageKey(wallet.getAddressString(), false, function (from_key) {
      const from_msg_key = from_key.public_message_key
      getMessageKey(add_to, false, function (to_key) {
        const to_msg_key = to_key.public_message_key

        let message_from = ''
        if (from_msg_key !== undefined) {
          message_from = cipherMessage(from_msg_key, message)
        }

        let message_to = ''
        if (to_msg_key !== undefined) {
          message_to = cipherMessage(to_msg_key, message)
        }

        const data_obj = {
          add_req: wallet.getAddressString(),
          add_cli: add_to,
          ref_req: message_from,
          ref_cli: message_to
        }

        const data_str = JSON.stringify(data_obj)
        const msg = ethUtil.toBuffer(data_str)
        const msgHash = ethUtil.hashPersonalMessage(msg)
        const signature = ethUtil.ecsign(msgHash, wallet.getPrivateKey())
        const sign = ethUtil.bufferToHex(Buffer.concat([signature.r, signature.s, ethUtil.toBuffer(signature.v)]))
        ajaxReq.publishReqMessages(data_str, sign, function (data) { callback(data) })
      })
    })
  }

  function getReqMessage (wallet, other_add, my_message_key, ISentThisMessage, callback) {
    const add_from = ISentThisMessage ? wallet.getAddressString() : other_add
    const add_to = !ISentThisMessage ? wallet.getAddressString() : other_add
    ajaxReq.getReqMessages(add_from, add_to, function (data) {
      let message = ''
      if (data !== undefined) {
        let crypted = ''
        if (ISentThisMessage && data.ref_from !== undefined) {
          crypted = data.ref_from
        } else if (!ISentThisMessage && data.ref_to !== undefined) {
          crypted = data.ref_to
        }

        if (crypted != '') {
          try {
            message = decipherMessage(my_message_key, crypted)
          } catch (e) {
            message = ''
          }
        }
      }
      callback(message)
    })
  }

  return {
    getMessageKey: getMessageKey,
    ensureWalletMessageKey: ensureWalletMessageKey,
    messageKeysFromWallet: messageKeysFromWallet,
    messageKeysFromCrypted: messageKeysFromCrypted,
    cipherMessage: cipherMessage,
    decipherMessage: decipherMessage,
    publishReqMessages: publishReqMessages,
    getReqMessage: getReqMessage
  }
}
module.exports = jsc3l_message
