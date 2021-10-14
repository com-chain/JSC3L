import ajaxReq from './rest/ajaxReq'
import * as connection from './connection'
import * as customization from './customization'
import * as message from './message'
import bcRead from './bcRead'
import * as bcTransaction from './bcTransaction'
import * as wallet from './wallet'
import * as ethFuncs from './ethereum/ethFuncs'
import blockies from './blockies'

import Wallet from './ethereum/myetherwallet'


function createIcon (address: string | Wallet) {
  if (address instanceof Wallet) {
    address = address.getAddressString()
  }
  return blockies({
    seed: address.toLowerCase(),
    size: 8,
    scale: 16
  }).toDataURL()
}


export {
  ajaxReq,
  connection,
  customization,
  message,
  bcRead,
  bcTransaction,
  wallet,
  ethFuncs,
  createIcon
}
