import { custoRepo, configRepo } from './config'
import { Http } from './rest/http'

///
// Pre-requisite: the variable confLocale should store an object with
// at least the following infos:
//   confLocale.server.lang
//   confLocale.server.notes
//   confLocale.server.url_Css
///

///
// [High level] Get the configuration for a given currency, store it
// in the locale storage 'ComChainServerConf'
///
export async function getConfJSON (name) {
  try {
    const conf = await Http.get(localStorage.getItem('ComChainRepo') +
             `${configRepo}/${name}.json`,
    { _: new Date().getTime() })
    localStorage.setItem('ComChainServerConf', JSON.stringify(conf))
    return conf
  } catch (err) {
    return false
  }
}

///
// [High level] Get the individual configuration
///

export function isApp () {
  return document.URL.indexOf('http://') === -1 &&
    document.URL.indexOf('https://') === -1
}

export function getEndpointAddress () {
  try {
    return localStorage.getItem('ComChainAPI')
  } catch (e) {
    return ''
  }
}

export function getCurrencyName () {
  return getServerConfig('name')
}

export function getContract1 () {
  return getServerConfig('contract_1')
}

export function getContract2 () {
  return getServerConfig('contract_2')
}

export function getContract3 () {
  return getServerConfig('contract_3')
}

export function getHelpUrl () {
  return getServerConfig('url_help')
}

export function getCondUrl () {
  return getServerConfig('url_cond')
}

export function getUnlockUrl () {
  return getServerConfig('url_unlock')
}

export function getHowToUrl () {
  return getServerConfig('url_howto')
}

export function getWalletAddress () {
  return getServerConfig('address')
}

export function getCreationMessage () {
  return getServerConfig('creat_message')
}

export function getLang () {
  return getServerConfig('lang') || confLocale.server.lang
}

export function getNoteValues () {
  return getServerConfig('notes') || confLocale.server.notes
}

export function hasBn () {
  return !!getNoteValues()
}

export function hasBnCheck () {
  return isApp() && hasBn()
}

export function getCssUrl () {
  try {
    return localStorage.getItem('ComChainRepo') + custoRepo +
      getCurrencyName() + '/css/etherwallet-master.min.css'
  } catch (e) {
    return confLocale.server.url_Css
  }
}

export function getCurrencyLogoUrl (currencyName) {
  if (!currencyName) return ''
  try {
    return localStorage.getItem('ComChainRepo') + custoRepo +
      currencyName + '/images/lem.png'
  } catch (e) {
    return ''
  }
}

export function hasNant () {
  return getServerConfigSwitch('nant', false)
}

export function hasCM () {
  return getServerConfigSwitch('CM', false)
}

export function hasAutor () {
  return getServerConfigSwitch('autor', false)
}

export function hasDeleg () {
  return getServerConfigSwitch('deleg', false)
}

export function hasPayRequest () {
  return getServerConfigSwitch('payReq', false)
}

export function passwordAutocomplete () {
  let number = 10000
  try {
    const config = JSON.parse(localStorage.getItem('ComChainServerConf')).server
    if (config.passwordAutocomplete && config.passwordAutocomplete > 0) {
      number = config.passwordAutocomplete
    }
  } catch (e) {

  }
  return number
}

// /////////////////////////////////////////////////////////////////////////////

export function updateCss () {
  // replace the CSS references into the DOM
  const newlink = document.createElement('link')
  newlink.setAttribute('rel', 'stylesheet')
  newlink.setAttribute('type', 'text/css')
  newlink.setAttribute('href', getCssUrl())
  document.getElementsByTagName('head').item(0).appendChild(newlink)
}

export function getCurrencies () {
  return getServerConfig('currencies')
}

export function configureCurrency () {
  if (getEndpointAddress() !== '') {
    updateCss()
  }
}

// /////////////////////////////////////////////////////////////////////////////

export function getServerConfig (configName) {
  try {
    return JSON.parse(localStorage.getItem('ComChainServerConf'))
      .server[configName]
  } catch (e) {
    return ''
  }
}

export function getServerConfigSwitch (configName, defaultValue) {
  try {
    return JSON.parse(localStorage.getItem('ComChainServerConf'))
      .server[configName].toString().toLowerCase() === 'true'
  } catch (e) {
    return defaultValue
  }
}

// /////////////////////////////////////////////////////////////////////////////
