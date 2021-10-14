import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import ethUtil from 'ethereumjs-util'
import scrypt from 'scryptsy'


export default class Wallet {
  privKey

  constructor (priv) {
    this.privKey = priv.length === 32 ? priv : Buffer.from(priv, 'hex')
  }

  static generate (icapDirect) {
    if (!icapDirect) {
      return new Wallet(crypto.randomBytes(32))
    }

    while (true) {
      const privKey = crypto.randomBytes(32)
      if (ethUtil.privateToAddress(privKey)[0] === 0) {
        return new Wallet(privKey)
      }
    }
  }

  static fromPrivateKey (priv) {
    return new Wallet(priv)
  }

  getPrivateKey () { return this.privKey }
  getPrivateKeyString () { return this.getPrivateKey().toString('hex') }
  getPublicKey () { return ethUtil.privateToPublic(this.privKey) }
  getPublicKeyString () { return '0x' + this.getPublicKey().toString('hex') }
  getAddress () { return ethUtil.privateToAddress(this.privKey) }
  getAddressString () { return '0x' + this.getAddress().toString('hex') }
  getChecksumAddressString () {
    return ethUtil.toChecksumAddress(this.getAddressString())
  }

  toV3 (password, opts) {
    opts = opts || {}
    const salt = opts.salt || crypto.randomBytes(32)
    const iv = opts.iv || crypto.randomBytes(16)
    let derivedKey
    const kdf = opts.kdf || 'scrypt'
    const kdfparams: {[k: string]: any} = {
      dklen: opts.dklen || 32,
      salt: salt.toString('hex')
    }
    if (kdf === 'pbkdf2') {
      kdfparams.c = opts.c || 262144
      kdfparams.prf = 'hmac-sha256'
      derivedKey = crypto.pbkdf2Sync(
        Buffer.from(password), salt, kdfparams.c, kdfparams.dklen, 'sha256')
    } else if (kdf === 'scrypt') {
      // FIXME: support progress reporting callback
      kdfparams.n = opts.n || 262144
      kdfparams.r = opts.r || 8
      kdfparams.p = opts.p || 1
      derivedKey = scrypt(
        Buffer.from(password), salt, kdfparams.n, kdfparams.r,
        kdfparams.p, kdfparams.dklen)
    } else {
      throw new Error('Unsupported kdf')
    }
    const cipher = crypto.createCipheriv(opts.cipher || 'aes-128-ctr',
      derivedKey.slice(0, 16), iv)
    if (!cipher) {
      throw new Error('Unsupported cipher')
    }
    const ciphertext = Buffer.concat(
      [cipher.update(this.privKey), cipher.final()])
    const mac = ethUtil.keccak(
      Buffer.concat([derivedKey.slice(16, 32), ciphertext]))

    const obj: {[k: string]: any} = {
      version: 3,
      id: uuidv4({
        random: opts.uuid || crypto.randomBytes(16)
      }),
      address: this.getAddress().toString('hex'),
      Crypto: {
        ciphertext: ciphertext.toString('hex'),
        cipherparams: {
          iv: iv.toString('hex')
        },
        cipher: opts.cipher || 'aes-128-ctr',
        kdf: kdf,
        kdfparams: kdfparams,
        mac: mac.toString('hex')
      },
      // ComChain addition:
      server: { name: opts.server_name }
    }

    if (opts.message_key !== 'undefined') {
      obj.message_key = opts.message_key
    }

    return obj
  }


  cipher (password, data, kdfparams) {
    if (!kdfparams) {
      throw new Error(
        'Wallet.cipher(..) requires a 3rd parameter kdfparams.'
      )
    }
    const iv = crypto.randomBytes(16)
    const derivedKey = scrypt(Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)

    const cipher = crypto.createCipheriv(
      'aes-128-ctr', derivedKey.slice(0, 16), iv)

    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()])
    const mac = ethUtil.keccak(
      Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
    return {
      crypto: {
        ciphertext: ciphertext.toString('hex'),
        cipherparams: {
          iv: iv.toString('hex')
        },
        cipher: 'aes-128-ctr',
        kdf: 'scrypt',
        kdfparams: kdfparams,
        mac: mac.toString('hex')
      }
    }
  }

  decifer (input, password) {
    const json = (typeof input === 'object')
      ? input
      : JSON.parse(input.toLowerCase())

    const kdfparams = json.crypto.kdfparams
    const derivedKey = scrypt(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, 'hex'),
      kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)

    const ciphertext = Buffer.from(json.crypto.ciphertext, 'hex')
    const mac = ethUtil.keccak(
      Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
    if (mac.toString('hex') !== json.crypto.mac) {
      throw new Error('Key derivation failed - possibly wrong passphrase')
    }
    const decipher = crypto.createDecipheriv(
      json.crypto.cipher, derivedKey.slice(0, 16),
      Buffer.from(json.crypto.cipherparams.iv, 'hex'))
    const seed = Wallet.decipherBuffer(decipher, ciphertext)
    return seed
  }

  toJSON () {
    return {
      address: this.getAddressString(),
      checksumAddress: this.getChecksumAddressString(),
      privKey: this.getPrivateKeyString(),
      pubKey: this.getPublicKeyString(),
      publisher: 'MyEtherWallet',
      encrypted: false,
      version: 2
    }
  }

  static fromMyEtherWallet (input, password) {
    const json = (typeof input === 'object') ? input : JSON.parse(input)
    let privKey
    if (!json.locked) {
      if (json.private.length !== 64) {
        throw new Error('Invalid private key length')
      }
      privKey = Buffer.from(json.private, 'hex')
    } else {
      if (typeof password !== 'string') {
        throw new Error('Password required')
      }
      if (password.length < 7) {
        throw new Error('Password must be at least 7 characters')
      }
      let cipher = json.encrypted ? json.private.slice(0, 128) : json.private
      cipher = Wallet.decodeCryptojsSalt(cipher)
      const evp = Wallet.evpKdf(Buffer.from(password), cipher.salt, {
        keysize: 32,
        ivsize: 16
      })
      const decipher = crypto.createDecipheriv('aes-256-cbc', evp.key, evp.iv)
      privKey = Wallet.decipherBuffer(decipher, Buffer.from(cipher.ciphertext))
      privKey = Buffer.from((privKey.toString()), 'hex')
    }
    const wallet = new Wallet(privKey)
    if (wallet.getAddressString() !== json.address) {
      throw new Error('Invalid private key or address')
    }
    return wallet
  }

  static fromMyEtherWalletV2 (input) {
    const json = (typeof input === 'object') ? input : JSON.parse(input)
    if (json.privKey.length !== 64) {
      throw new Error('Invalid private key length')
    };
    const privKey = Buffer.from(json.privKey, 'hex')
    return new Wallet(privKey)
  }

  static fromEthSale (input, password) {
    const json = (typeof input === 'object') ? input : JSON.parse(input)
    const encseed = Buffer.from(json.encseed, 'hex')
    const derivedKey = crypto.pbkdf2Sync(
      Buffer.from(password), Buffer.from(password), 2000, 32, 'sha256')
      .slice(0, 16)
    const decipher = crypto.createDecipheriv(
      'aes-128-cbc', derivedKey, encseed.slice(0, 16))
    const seed = Wallet.decipherBuffer(decipher, encseed.slice(16))
    const wallet = new Wallet(ethUtil.keccak(seed))
    if (wallet.getAddress().toString('hex') !== json.ethaddr) {
      throw new Error('Decoded key mismatch - possibly wrong passphrase')
    }
    return wallet
  }

  static fromMyEtherWalletKey (input, password) {
    let cipher = input.slice(0, 128)
    cipher = Wallet.decodeCryptojsSalt(cipher)
    const evp = Wallet.evpKdf(Buffer.from(password), cipher.salt, {
      keysize: 32,
      ivsize: 16
    })
    const decipher = crypto.createDecipheriv('aes-256-cbc', evp.key, evp.iv)
    let privKey = Wallet.decipherBuffer(decipher,
      Buffer.from(cipher.ciphertext))
    privKey = Buffer.from((privKey.toString()), 'hex')
    return new Wallet(privKey)
  }

  static fromV3 (input, password, nonStrict) {
    const json = (typeof input === 'object')
      ? input
      : JSON.parse(nonStrict ? input.toLowerCase() : input)
    if (json.version !== 3) {
      throw new Error('Not a V3 wallet')
    }
    let derivedKey
    let kdfparams
    if (json.crypto.kdf === 'scrypt') {
      kdfparams = json.crypto.kdfparams
      derivedKey = scrypt(
        Buffer.from(password),
        Buffer.from(kdfparams.salt, 'hex'),
        kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)
    } else if (json.crypto.kdf === 'pbkdf2') {
      kdfparams = json.crypto.kdfparams
      if (kdfparams.prf !== 'hmac-sha256') {
        throw new Error('Unsupported parameters to PBKDF2')
      }
      derivedKey = crypto.pbkdf2Sync(
        Buffer.from(password),
        Buffer.from(kdfparams.salt, 'hex'),
        kdfparams.c, kdfparams.dklen, 'sha256')
    } else {
      throw new Error('Unsupported key derivation scheme')
    }
    const ciphertext = Buffer.from(json.crypto.ciphertext, 'hex')
    const mac = ethUtil.keccak(Buffer.concat(
      [derivedKey.slice(16, 32), ciphertext]))
    if (mac.toString('hex') !== json.crypto.mac) {
      throw new Error('Key derivation failed - possibly wrong passphrase')
    }
    const decipher = crypto.createDecipheriv(
      json.crypto.cipher, derivedKey.slice(0, 16),
      Buffer.from(json.crypto.cipherparams.iv, 'hex'))
    const seed = Wallet.decipherBuffer(decipher, ciphertext)
    return new Wallet(seed)
  }

  toV3String (password, opts) {
    return JSON.stringify(this.toV3(password, opts))
  }

  getV3Filename (timestamp) {
    const ts = timestamp ? new Date(timestamp) : new Date()
    return [
      'UTC--',
      ts.toJSON().replace(/:/g, '-'),
      '--',
      this.getAddress().toString('hex')
    ].join('')
  }

  static decipherBuffer (decipher, data) {
    return Buffer.concat([decipher.update(data), decipher.final()])
  }

  static decodeCryptojsSalt (input) {
    const ciphertext = Buffer.from(input, 'base64')
    if (ciphertext.slice(0, 8).toString() === 'Salted__') {
      return {
        salt: ciphertext.slice(8, 16),
        ciphertext: ciphertext.slice(16)
      }
    } else {
      return {
        ciphertext: ciphertext
      }
    }
  }

  static evpKdf (data, salt, opts) {
    // A single EVP iteration, returns `D_i`, where block equlas to `D_(i-1)`

    function iter (block) {
      let hash = crypto.createHash(opts.digest || 'md5')
      hash.update(block)
      hash.update(data)
      hash.update(salt)
      block = hash.digest()
      for (let i = 1; i < (opts.count || 1); i++) {
        hash = crypto.createHash(opts.digest || 'md5')
        hash.update(block)
        block = hash.digest()
      }
      return block
    }
    const keysize = opts.keysize || 16
    const ivsize = opts.ivsize || 16
    const ret = []
    let i = 0
    while (Buffer.concat(ret).length < (keysize + ivsize)) {
      ret[i] = iter((i === 0) ? Buffer.alloc(0) : ret[i - 1])
      i++
    }
    const tmp = Buffer.concat(ret)
    return {
      key: tmp.slice(0, keysize),
      iv: tmp.slice(keysize, keysize + ivsize)
    }
  }

  static walletRequirePass (ethjson) {
    let jsonArr
    try {
      jsonArr = JSON.parse(ethjson)
    } catch (err) {
      throw new Error('This is not a valid wallet file.')
    }
    if (jsonArr.encseed != null) return true
    else if (jsonArr.Crypto != null || jsonArr.crypto != null) return true
    else if (jsonArr.hash != null && jsonArr.locked) return true
    else if (jsonArr.hash != null && !jsonArr.locked) return false
    else if (jsonArr.publisher === 'MyEtherWallet' &&
             !jsonArr.encrypted) return false
    else {
      throw new Error("Sorry! We don't recognize this type of wallet file.")
    }
  }

  signMessage (msg) {
    const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(msg))
    const signature = ethUtil.ecsign(msgHash, this.privKey)
    return ethUtil.bufferToHex(
      Buffer.concat([signature.r, signature.s, ethUtil.toBuffer(signature.v)]))
  }

  //
  // QR Codes
  //

  makeSignedQR(obj) {

    debugger;

    var {server, destinary, begin, end, viewbalance, viewoldtran, pub_key} = obj
    var formatDate = (date) => `${begin.getFullYear()}/${begin.getMonth()}/${begin.getDate()}`
    var objContent = Object.assign(obj, {
      address: this.getAddressString(),
      begin: formatDate(begin),
      end: formatDate(end)
    })

    var hash = ethUtil.sha3(JSON.stringify(objContent))
    var signature = ethUtil.ecsign(hash, this.privKey)
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

  checkSignedQRFromString(qrString, intendedRecipientAddress) {
    try {
      var { data, signature } = JSON.parse(qrString);
    } catch (e) {
      return "InvalidFormat"
    }
    return this.checkSignedQR(data, signature, intendedRecipientAddress)
  }

  checkSignedQR(data, signature, intendedRecipientAddress) {
    try {
      var hash = ethUtil.sha3(JSON.stringify(data));
      var publicSignKey = ethUtil.ecrecover(hash, signature.v, signature.r, signature.s);
      var receiverAddress = ethUtil.bufferToHex(ethUtil.publicToAddress(publicSignKey));
    } catch (e) {
      return "InvalidFormat"
    }

    if (receiverAddress !== data.address) { return 'InvalidSignature' }
    if (data.destinary !== intendedRecipientAddress) { return 'NotForYou' }
    if ((new Date(data.end)).getTime() < (new Date()).getTime()) {
      return 'Expired'
    }
    return { signature, data }
  }


}