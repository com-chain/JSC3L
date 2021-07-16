import config from './config'
import Wallet from './ethereum/myetherwallet'

///
//
// Pre-requisite: the variable conf_locale should store an object with at least the following infos:
// conf_locale.server.lang
// conf_locale.server.notes
// conf_locale.server.url_Css
///

const customization = function () {}

///
// [High level] Get the configuration for a given currency, store it in the locale storage 'ComChainServerConf'
///
customization.getConfJSON = function (name) {
  // TODO: use http
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', localStorage.getItem('ComChainRepo') + config.configRepo + '/' + name + '.json' + '?_=' + new Date().getTime(), true) //
    xhr.responseType = 'json'
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState !== 4) return
      if (xhr.status !== 200) {
        resolve(false)
        return
      }
      try {
        let to_push = xhr.response
        if (typeof to_push === 'object') {
          to_push = JSON.stringify(xhr.response)
        }

        localStorage.setItem('ComChainServerConf', to_push)
        resolve(true)
      } catch (e) {
        resolve(false)
      }
    }
    xhr.send()
  })
}

///
// [High level] Get the individual configuration
///

customization.isApp = function () {
  return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1
}

customization.getEndpointAddress = function () {
  try {
    return localStorage.getItem('ComChainAPI')
  } catch (e) {
    return ''
  }
}

customization.getCurencyName = function () {
  return getServerConfig('name')
}

customization.getContract1 = function () {
  return getServerConfig('contract_1')
}

customization.getContract2 = function () {
  return getServerConfig('contract_2')
}

customization.getContract3 = function () {
  return getServerConfig('contract_3')
}

customization.getHelpUrl = function () {
  return getServerConfig('url_help')
}

customization.getCondUrl = function () {
  return getServerConfig('url_cond')
}

customization.getUnlockUrl = function () {
  return getServerConfig('url_unlock')
}

customization.getHowToUrl = function () {
  return getServerConfig('url_howto')
}

customization.getWalletAddress = function () {
  return getServerConfig('address')
}

customization.getCreationMessage = function () {
  return getServerConfig('creat_message')
}

customization.getLang = function () {
  let lang = getServerConfig('lang')
  if (lang == undefined || lang == '') {
    lang = conf_locale.server.lang
  }
  return lang
}

customization.getNoteValues = function () {
  let notes = getServerConfig('notes')
  if (notes == undefined || notes == '') {
    notes = conf_locale.server.notes
  }
  return notes
}

customization.hasBn = function () {
  const notes = customization.getNoteValues()
  return notes != undefined && notes.length > 0
}

customization.hasBnCheck = function () {
  return customization.isApp() && customization.hasBn()
}

customization.getCssUrl = function () {
  try {
    return localStorage.getItem('ComChainRepo') + config.custoRepo + customization.getCurencyName() + '/css/etherwallet-master.min.css'
  } catch (e) {
    return conf_locale.server.url_Css
  }
}

customization.getCurrencyLogoUrl = function (currency_name) {
  if (currency_name) {
    try {
      return localStorage.getItem('ComChainRepo') + config.custoRepo + currency_name + '/images/lem.png'
    } catch (e) {
      return ''
    }
  }
}

customization.hasNant = function () {
  return getServerConfigSwitch('nant', false)
}

customization.hasCM = function () {
  return getServerConfigSwitch('CM', false)
}

customization.hasAutor = function () {
  return getServerConfigSwitch('autor', false)
}

customization.hasDeleg = function () {
  return getServerConfigSwitch('deleg', false)
}

customization.hasPayRequest = function () {
  return getServerConfigSwitch('payReq', false)
}

customization.passwordAutocomplete = function () {
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

/// /////////////////////////////////////////////////////////////////////////////
customization.updateCss = function () {
  // replace the CSS references into the DOM
  const oldlink = document.getElementsByTagName('link').item(0)
  const newlink = document.createElement('link')
  newlink.setAttribute('rel', 'stylesheet')
  newlink.setAttribute('type', 'text/css')
  newlink.setAttribute('href', customization.getCssUrl())
  document.getElementsByTagName('head').item(0).appendChild(newlink)
}

customization.getCurrencies = function () {
  return getServerConfig('currencies')
}

customization.configureCurrency = function () {
  if (customization.getEndpointAddress() != '') {
    customization.updateCss()
  }
}

/// /////////////////////////////////////////////////////////////////////////////

var getServerConfig = function (config_name) {
  try {
    return JSON.parse(localStorage.getItem('ComChainServerConf')).server[config_name]
  } catch (e) {
    return ''
  }
}

var getServerConfigSwitch = function (config_name, default_value) {
  try {
    return JSON.parse(localStorage.getItem('ComChainServerConf')).server[config_name].toString().toLowerCase() == 'true'
  } catch (e) {
    return default_value
  }
}

/// /////////////////////////////////////////////////////////////////////////////

module.exports = customization
