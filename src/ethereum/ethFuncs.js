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
  hex = this.sanitizeHex(hex)
  return new BigNumber(hex).plus(etherUnits.getValueOfUnit('gwei'))
    .toDigits(2).toString(16)
}

export function decimalToHex (dec) {
  return new BigNumber(dec).toString(16)
}

export function getNakedAddress (address) {
  return address.toLowerCase().replace('0x', '')
}

export function padLeft (n, width, z) {
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
