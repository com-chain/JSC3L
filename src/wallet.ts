import AjaxReq from './rest/ajaxReq'
import {
  checkSignedQR, SignedQR, makeSignedQRContent, makeSignedQRFragments
} from './qr'
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
    return { pub: mPub, priv: cipherMsg(this.getPublicKeyString(), mPriv) }
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

  public validateEnrollment (id, signature) {
    return this.ajaxReq.enrollPost({
      id,
      signature,
      currency: this.currencyName,
    })
  }

  public enrollAddress (id, token) {
    return this.ajaxReq.enrollPost({
      id,
      token,
      currency: this.currencyName,
      // XXXvlab: Yes, typo is intentional here (in PHP API):
      addresse: this.getAddressString(),
    })
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
  // QR Code helpers
  //

  public makeSignedQRContent (obj, pubKey: string | null) {
    return makeSignedQRContent({
      server: this.currencyName,
      address: this.getAddressString(),
      ...obj,
      ...pubKey && {
        message_key: cipherMsg(pubKey, this.messageKeysFromWallet())
      },
    }, this.privKey)
  }

  public makeSignedQRFragments (
    obj, fragmentCount: number, pubKey: string | null
  ) {
    return makeSignedQRFragments(
      this.makeSignedQRContent(obj, pubKey),
      fragmentCount,
    )
  }

  public checkSignedQRFromString (qrString: string) {
    let qrContent: SignedQR
    try {
      qrContent = JSON.parse(qrString)
    } catch (e) {
      return 'InvalidFormat'
    }
    return checkSignedQR(qrContent, this.getAddressString())
  }

}
