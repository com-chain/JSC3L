import BigNumber from 'bignumber.js'
import ethUtil from 'ethereumjs-util'

import * as etherUnits from './etherUnits'

function isChecksumAddress (address) {
  return address === ethUtil.toChecksumAddress(address)
}

export function validateEtherAddress (address) {
  if (address.substring(0, 2) !== '0x') return false
  else if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false
  else if (/^(0x)?[0-9a-f]{40}$/.test(address) ||
           /^(0x)?[0-9A-F]{40}$/.test(address)) return true
  else { return isChecksumAddress(address) }
}

export function validateHexString (str) {
  if (str === '') return true
  str = str.substring(0, 2) === '0x'
    ? str.substring(2).toUpperCase()
    : str.toUpperCase()
  const re = /^[0-9A-F]+$/g
  return re.test(str)
}

export function sanitizeHex (hex) {
  hex = hex.substring(0, 2) === '0x' ? hex.substring(2) : hex
  if (hex === '') return ''
  return '0x' + padLeftEven(hex)
}

function padLeftEven (hex) {
  hex = hex.length % 2 !== 0 ? '0' + hex : hex
  return hex
}

export function addTinyMoreToGas (hex) {
  hex = sanitizeHex(hex)
  return new BigNumber(hex).plus(etherUnits.getValueOfUnit('gwei'))
    .toDigits(2).toString(16)
}

export function decimalToHex (dec) {
  return new BigNumber(dec).toString(16)
}

export function getNakedAddress (address) {
  return address.toLowerCase().replace('0x', '')
}

export function padLeft (n, width, z?) {
  z = z || '0'
  n = n + ''
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

export function getDataObj (to, func, arrVals) {
  let val = ''
  for (let i = 0; i < arrVals.length; i++) val += padLeft(arrVals[i], 64)
  return { to: to, data: func + val }
}

export function encodeNumber (number) {
  let valueHex
  if (number < 0) {
    valueHex = padLeft(new BigNumber(16).pow(64).plus(number).toString(16), 64)
  } else {
    valueHex = padLeft(new BigNumber(number).toString(16), 64)
  }

  return valueHex
}


/* @skip-prod-transpilation */
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe('encodeNumber', () => {
    it('should encode 0 to "00...0000"', () => {
      expect(encodeNumber(0)).toBe('0000000000000000000000000000000000000000000000000000000000000000')
    })
    it('should encode 1 to "00...0001"', () => {
      expect(encodeNumber(1)).toBe('0000000000000000000000000000000000000000000000000000000000000001')
    })
    it('should encode 16 to "00...0010"', () => {
      expect(encodeNumber(16)).toBe('0000000000000000000000000000000000000000000000000000000000000010')
    })
    it('should encode 0x1f_ffff_ffff_ffff to "00...ffff_ffff_ffff"', () => {
      expect(encodeNumber(0x1f_ffff_ffff_ffff)).toBe('000000000000000000000000000000000000000000000000001fffffffffffff')
    })

    it('should encode -1 to "ff...ffff"', () => {
      expect(encodeNumber(-1)).toBe('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    })
    it('should encode -0xf to "ff...fff1"', () => {
      expect(encodeNumber(-0xf)).toBe('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1')
    })
    it('should encode -0x10 to "ff...fff0"', () => {
      expect(encodeNumber(-0x10)).toBe('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0')
    })
    it('should encode -0x1f_ffff_ffff_fffff to "ff...e0000000000001"', () => {
      expect(encodeNumber(-0x1f_ffff_ffff_ffff)).toBe('ffffffffffffffffffffffffffffffffffffffffffffffffffe0000000000001')
    })

    it('should refuse to encode 0x1ff_ffff_ffff_ffff', () => {
      expect(() => encodeNumber(0x20_0000_0000_0000)).toThrowError('number type')
    })
    it('should refuse to encode -0x20_0000_0000_0000', () => {
      expect(() => encodeNumber(-0x20_0000_0000_0000)).toThrowError('number type')
    })

  })
}