import crypto from 'crypto'
import { ec as EC } from 'elliptic'

/// Code adapted from https://github.com/LimelabsTech/eth-ecies

const ec = new EC('secp256k1')

function AES256CbcEncrypt (iv, key, plaintext) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const firstChunk = cipher.update(plaintext)
  const secondChunk = cipher.final()

  return Buffer.concat([firstChunk, secondChunk])
}

function AES256CbcDecrypt (iv, key, ciphertext) {
  const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  const firstChunk = cipher.update(ciphertext)
  const secondChunk = cipher.final()

  return Buffer.concat([firstChunk, secondChunk])
}

function BufferEqual (b1, b2) {
  if (b1.length !== b2.length) {
    return false
  }

  let res = 0
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i]
  }

  return res === 0
}

export function Encrypt (publicKey, plaintext) {
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
  const hash = crypto.createHash('sha512')
    .update(Buffer.from(px.toArray())).digest()
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

export function Decrypt (privateKey, encrypted) {
  const encryptedBuff = Buffer.from(encrypted, 'hex')
  const privateKeyBuff = Buffer.from(privateKey)

  // Read iv, ephemPubKey, mac, ciphertext from encrypted message

  const iv = encryptedBuff.slice(0, 16)
  const ephemPubKeyEncoded = encryptedBuff.slice(16, 81)
  const mac = encryptedBuff.slice(81, 113)
  const ciphertext = encryptedBuff.slice(113)
  const ephemPubKey = ec.keyFromPublic(ephemPubKeyEncoded).getPublic()

  const px = ec.keyFromPrivate(privateKeyBuff).derive(ephemPubKey)
  const hash = crypto.createHash('sha512')
    .update(Buffer.from(px.toArray())).digest()
  const encryptionKey = hash.slice(0, 32)
  const macKey = hash.slice(32)
  const dataToMac = Buffer.concat([iv, ephemPubKeyEncoded, ciphertext])
  const computedMac = crypto.createHmac('sha256', macKey)
    .update(dataToMac).digest()

  // Verify mac
  if (!BufferEqual(computedMac, mac)) {
    throw new Error('MAC mismatch')
  }

  const plaintext = AES256CbcDecrypt(iv, encryptionKey, ciphertext)

  return plaintext.toString()
}

