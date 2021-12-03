import ethUtil from 'ethereumjs-util'

import AjaxReq from './rest/ajaxReq'
import { shortenAddress, cipherMsg, decipherMsg } from './ethereum/cipher'
import Wallet from './ethereum/myetherwallet'


export default abstract class MessagingWalletAbstract extends Wallet {

  abstract ajaxReq: AjaxReq  // need to be provided
  abstract currencyName: string
  abstract unlockUrl: string

  message_key: null | {pub: string, priv: string} = null

  public static async createWallet (this: { new(): MessagingWalletAbstract }) {
    const wallet = new this()
    await wallet.ensureWalletMessageKey()
    return wallet
  }

  private publishMessageKey () {
    const dataStr = JSON.stringify({
      address: this.getAddressString(),
      public_message_key: this.message_key.pub,
      private_message_key: this.message_key.priv,
    })

    return this.ajaxReq.publishMessageKey(dataStr, this.signMessage(dataStr))
  }

  public async publishReqMessages (addTo, message) {
    const addFrom = this.getAddressString()
    const pubKey = async (add) =>
      (await this.ajaxReq.getMessageKey(add, false)).public_message_key

    const fromMsgKey = await pubKey(addFrom)
    const toMsgKey = await pubKey(addTo)

    const dataStr = JSON.stringify({
      add_req: addFrom,
      add_cli: addTo,
      ref_req: fromMsgKey ? cipherMsg(fromMsgKey, message) : '',
      ref_cli: toMsgKey ? cipherMsg(toMsgKey, message) : '',
    })
    return this.ajaxReq.publishReqMessages(dataStr, this.signMessage(dataStr))
  }

  async ensureWalletMessageKey () {
    const remoteKey = await this.ajaxReq.getMessageKey(
      this.getAddressString(), true)
    const walletMessageKey = this?.message_key
    if (typeof remoteKey.public_message_key !== 'undefined') {
      this.message_key = {
        pub: remoteKey.public_message_key,
        priv: remoteKey.private_message_key,
      }
      if (walletMessageKey?.pub !== remoteKey.public_message_key) {
        return 'REPLACED_WITH_REMOTE'
      }
      return
    }

    if (!walletMessageKey?.pub || !walletMessageKey?.priv) {
      this.message_key = this.newMessageKey()
      this.publishMessageKey()
      return 'CREATED_NEW'
    }
  }

  public async getReqMessage (otherAdd, myMessageKey, didISentThisMsg) {
    const myAdd = this.getAddressString()
    const addFrom = didISentThisMsg ? myAdd : otherAdd
    const addTo = !didISentThisMsg ? myAdd : otherAdd
    const data = await this.ajaxReq.getReqMessages(addFrom, addTo)
    if (!data) return ''

    let crypted = ''
    if (didISentThisMsg && data.ref_from) {
      crypted = data.ref_from
    } else if (!didISentThisMsg && data.ref_to) {
      crypted = data.ref_to
    } else {
      return ''
    }

    try {
      return decipherMsg(myMessageKey, crypted)
    } catch (e) {
      return ''
    }
  }

  private newMessageKey () {
    const newKey = Wallet.generate(false)
    const mPub = newKey.getPublicKeyString()
    const mPriv = newKey.getPrivateKeyString()
    return { pub: mPub, priv: cipherMsg(mPub, mPriv) }
  }

  public messageKeysFromCrypted (cipheredKey) {
    // XXXvlab: here we are converting to hex and de-converting in decipherMsg...
    return shortenAddress(decipherMsg(this.getPrivateKeyString(), cipheredKey))
  }

  public messageKeysFromWallet () {
    return this.messageKeysFromCrypted(this.message_key.priv)
  }


  //
  // Using currencyName
  //

  public encryptWallet (password) {
    return this.toV3(password, {
      kdf: 'scrypt',
      n: 1024,
      server_name: this.currencyName,
      message_key: this.message_key
    })
  }

  public enrollAddress (codeId, token) {
    return this.ajaxReq.enrollAddress(
      codeId, this.getAddressString(),
      this.currencyName, token)
  }

  public requestUnlock () {
    return this.ajaxReq.requestUnlock(
      this.getAddressString(),
      this.unlockUrl)
  }

  public static getWalletFromPrivKeyFile (jsonStr, password) {
    const jsonArr = JSON.parse(jsonStr)
    if (jsonArr.encseed != null) return this.fromEthSale(jsonStr, password)
    else if (jsonArr.Crypto != null ||
      jsonArr.crypto != null) {
      return this.fromV3(jsonStr, password, true)
    } else if (jsonArr.hash != null) {
      return this.fromMyEtherWallet(jsonStr, password)
    } else if (jsonArr.publisher === 'MyEtherWallet') {
      return this.fromMyEtherWalletV2(jsonStr)
    } else {
      throw new Error("Sorry! We don't recognize this type of wallet file.")
    }
  }


  //
  // QR Codes requires EthUtils
  //

  public makeSignedQRWithPubKey (objContent, pubKey) {
    objContent.message_key = cipherMsg(
      pubKey, this.messageKeysFromWallet()
    )
    objContent.address = this.getAddressString()
    return this.makeSignedQR(objContent)
  }

  public makeSignedQR (obj) {

    // Values expected:
    const {
      server, destinary, begin, end,
      viewbalance, viewoldtran, pub_key
    } = obj
    const formatDate = (date) =>
      `${begin.getFullYear()}/${begin.getMonth()}/${begin.getDate()}`
    const objContent = Object.assign(obj, {
      address: this.getAddressString(),
      begin: formatDate(begin),
      end: formatDate(end)
    })

    const hash = ethUtil.sha3(JSON.stringify(objContent))
    const signature = ethUtil.ecsign(hash, this.privKey)
    return {
      signature,
      qrContent: JSON.stringify({
        data: objContent,
        signature: {
          v: signature.v,
          r: '0x' + signature.r.toString('hex'),
          s: '0x' + signature.s.toString('hex')
        }
      })
    }
  }

}

// // TODO: What to do with this validateEnrollment
// public static validateEnrollment (codeId, signature) {
//     return this.ajaxReq.validateEnrollmentLetter(
//       codeId, this.currencyName, signature)
//   }

