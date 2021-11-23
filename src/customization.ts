
export default abstract class CustomizationAbstract {

  abstract cfg: any
  localDefaultConf: any

  /**
   * Pre-requisite: the variable confLocale should store an object with
   * at least the following infos:
   *   localDefaultConf.server.lang
   *   localDefaultConf.server.notes
   *   localDefaultConf.server.url_Css
   */
  constructor (localDefaultConf) {
    this.localDefaultConf = localDefaultConf
  }

  // [High level] Get the individual configuration
  ///

  public getCurrencyName () {
    return this.getServerConfig('name')
  }

  public getContract1 () {
    return this.getServerConfig('contract_1')
  }

  public getContract2 () {
    return this.getServerConfig('contract_2')
  }

  public getContract3 () {
    return this.getServerConfig('contract_3')
  }

  public getHelpUrl () {
    return this.getServerConfig('url_help')
  }

  public getCondUrl () {
    return this.getServerConfig('url_cond')
  }

  public getUnlockUrl () {
    return this.getServerConfig('url_unlock')
  }

  public getHowToUrl () {
    return this.getServerConfig('url_howto')
  }

  public getWalletAddress () {
    return this.getServerConfig('address')
  }

  public getCreationMessage () {
    return this.getServerConfig('creat_message')
  }

  public getLang () {
    return this.getServerConfig('lang') || this.localDefaultConf.server?.lang
  }

  public getNoteValues () {
    return this.getServerConfig('notes') || this.localDefaultConf.server?.notes
  }

  public hasBn () {
    return !!this.getNoteValues()
  }

  public hasNant () {
    return this.getServerConfigSwitch('nant', false)
  }

  public hasCM () {
    return this.getServerConfigSwitch('CM', false)
  }

  public hasAutor () {
    return this.getServerConfigSwitch('autor', false)
  }

  public hasDeleg () {
    return this.getServerConfigSwitch('deleg', false)
  }

  public hasPayRequest () {
    return this.getServerConfigSwitch('payReq', false)
  }

  public passwordAutocomplete () {
    let number = 10000
    try {
      if (this.cfg.server.passwordAutocomplete &&
          this.cfg.server.passwordAutocomplete > 0) {
        number = this.cfg.server.passwordAutocomplete
      }
    } catch (e) {

    }
    return number
  }

  public getCurrencies () {
    return this.getServerConfig('currencies')
  }

  // ///////////////////////////////////////////////////////////////////////////

  public getServerConfig (configName) {
    try {
      return this.cfg.server[configName]
    } catch (e) {
      return ''
    }
  }

  public getServerConfigSwitch (configName, defaultValue) {
    try {
      return this.cfg.server[configName].toString().toLowerCase() === 'true'
    } catch (e) {
      return defaultValue
    }
  }

  // ///////////////////////////////////////////////////////////////////////////

  public getCurrencyAssetBaseUrl (currencyName?: string) {
    if (!currencyName) {
      currencyName = this.cfg.server.name
    }
    return `${this.cfg.custoRepo}${currencyName}`
  }

  public getCssUrl (currencyName?: string) {
    try {
      // XXXvlab: I guess that we don't need to keep 'etherwallet' css names
      return `${this.getCurrencyAssetBaseUrl(currencyName)}/css/etherwallet-master.min.css`
    } catch (e) {
      return this.localDefaultConf.server.url_Css
    }
  }

  public getCurrencyLogoUrl (currencyName?: string) {
    try {
      // XXXvlab: I guess that 'lem' stands for leman here. Shouldn't that
      // be agnostic ?
      return `${this.getCurrencyAssetBaseUrl(currencyName)}/images/lem.png`
    } catch (e) {
      return ''
    }
  }

}