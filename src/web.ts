import { custoRepo } from './config'
import { getCurrencyName, getEndpointAddress } from './customization'


declare var confLocale: any

export function getCssUrl () {
  try {
    return localStorage.getItem('ComChainRepo') + custoRepo +
      getCurrencyName() + '/css/etherwallet-master.min.css'
  } catch (e) {
    return confLocale.server.url_Css
  }
}

export function configureCurrency () {
  if (getEndpointAddress() !== '') {
    updateCss()
  }
}

export function updateCss () {
  // replace the CSS references into the DOM
  const newlink = document.createElement('link')
  newlink.setAttribute('rel', 'stylesheet')
  newlink.setAttribute('type', 'text/css')
  newlink.setAttribute('href', getCssUrl())
  document.getElementsByTagName('head').item(0).appendChild(newlink)
}
