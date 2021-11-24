import * as ethFuncs from './ethereum/ethFuncs'  // Utilities to pass on
import * as memo from './memo'

// Only required for blockie helper
import blockies from './blockies'
import Wallet from './ethereum/myetherwallet'

import * as t from './type'


// Abstracts

import HttpAbstract from './rest/http'
import EndpointAbstract from './rest/endpoint'
import AjaxReqAbstract from './rest/ajaxReq'
import ConnectionMgrAbstract from './connection'
import CustomizationAbstract from './customization'
import MessagingWalletAbstract from './wallet'
import BcReadAbstract from './bcRead'
import BcTransactionAbstract from './bcTransaction'



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


abstract class AbstractJsc3l {

  protected abstract httpRequest: t.HttpRequest
  protected abstract persistentStore: t.IPersistentStore

  localDefaultConf: {}

  endpoint: string

  _Endpoint: new (baseUrl: any) => EndpointAbstract
  _connection: null | ConnectionMgrAbstract
  _http: null | HttpAbstract


  constructor (localDefaultConf?) {
    this.localDefaultConf = localDefaultConf || {}
  }

  /**
   * `connection` facility needs to be lazy loaded as `this` and
   * abstract `httpRequest` is not available in constructor.
   */
  get connection () {
    if (!this._connection) {
      const self = this
      class ConnectionMgr extends ConnectionMgrAbstract {
        http = self.http
        persistentStore = self.persistentStore
      }
      this._connection = new ConnectionMgr()
    }
    return this._connection
  }

  /**
   * `Endpoint` class is a facility that needs to be lazy loaded as
   * `this` and abstract `httpRequest` is not available in
   * constructor.
   */
  get Endpoint () {
    if (!this._Endpoint) {
      const self = this
      class Endpoint extends EndpointAbstract {
        httpRequest = self.httpRequest
      }
      this._Endpoint = Endpoint
    }
    return this._Endpoint
  }

  /**
   * 'http' facility needs to be lazy loaded as 'this' and abstract
   * httpRequest is not available in constructor.
   */
  get http () {
    if (!this._http) {
      const self = this
      // ConnectionMgr

      class Http extends HttpAbstract {
        httpRequest = self.httpRequest
      }
      this._http = new Http()
    }
    return this._http
  }



  getAjaxReq (endpointUrl: string): AjaxReqAbstract {
    const self = this
    class AjaxReq extends AjaxReqAbstract {
      endpoint = new self.Endpoint(endpointUrl)
    }
    return new AjaxReq()
  }

  /**
   * `getConfJson` check persistent storage for configuration for
   * given currency, otherwise will use the given repo to fetch
   * it (and save it in persistent storage).
   */
  async getConfig (repo: string, currencyName: string) {
    const cfgJson = this.connection.getLocalConfJSON()
    if (cfgJson && cfgJson.server.name === currencyName) {
      return cfgJson
    }
    return await this.connection.getConfJSON(currencyName, repo)
  }


  /**
   * `getConfJson` check persistent storage for configuration for
   * given currency, otherwise will use the given repo to fetch
   * it (and save it in persistent storage).
   */
  getCustomization (config: any): CustomizationAbstract {
    class Customization extends CustomizationAbstract {
      cfg = config
    }
    return new Customization(this.localDefaultConf)
  }


  getWallet (
    endpointUrl: string,
    currencyName: string,
    unlockUrl: string): new () => MessagingWalletAbstract {

    const self = this
    class MessagingWallet extends MessagingWalletAbstract {
      ajaxReq = self.getAjaxReq(endpointUrl)
      currencyName = currencyName
      unlockUrl = unlockUrl
    }
    // XXXvlab: should we instanciate this ?
    return MessagingWallet
  }


  getBcRead (endpointUrl, contracts): BcReadAbstract {
    const self = this
    class BcRead extends BcReadAbstract {
      ajaxReq = self.getAjaxReq(endpointUrl)
      contracts = contracts
    }
    return new BcRead()
  }


  getBcTransaction (endpointUrl, contracts): BcTransactionAbstract {
    const self = this
    class BcTransaction extends BcTransactionAbstract {
      ajaxReq = self.getAjaxReq(endpointUrl)
      contracts = contracts
    }
    return new BcTransaction()
  }


  _currencyMgrPromises = {}
  async getCurrencyMgr (currencyName: string, endpointUrl?: string, repoUrl?: string) {
    const key = Array.from(arguments).join('\0')

    if (!this._currencyMgrPromises[key]) {
      this._currencyMgrPromises[key] =
        this._getCurrencyMgr(currencyName, endpointUrl, repoUrl)
    }

    return await this._currencyMgrPromises[key]
  }


  async _getCurrencyMgr (currencyName: string,
                         endpointUrl?: string,
                         repoUrl?: string): Promise<any> {
    if (!repoUrl) {
      if (this.connection.repo) {
        repoUrl = this.connection.repo
      } else {
        repoUrl = await this.connection.lookupAvailableComChainRepo()
      }
    }

    if (!endpointUrl) {
      if (this.connection.endpoint) {
        endpointUrl = this.connection.endpoint
      } else {
        endpointUrl = (await this.connection.acquireEndPoint(repoUrl)).endpoint
      }
    }

    const config = await this.getConfig(repoUrl, currencyName)
    const customization = this.getCustomization(config)
    const contracts = [
      customization.getContract1(),
      customization.getContract2()
    ]

    const self = this
    const wallet = this.getWallet(
        endpointUrl, currencyName, customization.getUnlockUrl())
    return {
      // unlockWallet: (jsonData, password) => wallet.getWalletFromPrivKeyFile(jsonData, password),
      jsc3l: this,
      customization,
      ajaxReq: this.getAjaxReq(endpointUrl),
      wallet: wallet,
      bcRead: this.getBcRead(endpointUrl, contracts),
      bcTransaction: this.getBcTransaction(endpointUrl, contracts),
    }
  }
}






Object.assign(AbstractJsc3l.prototype, {
  memo,
  ethFuncs,
  createIcon
})


abstract class IntegratedJsc3lAbstract extends AbstractJsc3l {

  /**
   * `ajaxReq` depends on a loaded endpoint in
   * `this.connection.endpoint` obtained through
   * `this.endpoint.acquireEndPoint(..)`.  XXXvlab: We could cache the
   * result with endpoint being a key.
   */
  get ajaxReq (): AjaxReqAbstract {
    if (!this.connection.endpoint) {
      throw new Error('An endpoint need to have been acquired.')
    }
    return this.getAjaxReq(this.connection.endpoint)
  }


  /**
   * `customization` depends on a local configuration being available
   * through a previous call to
   * `this.connection.getConfJSON(..)`. Although as it has some
   * fallback available, we need to be able to support being called
   * even if no local conf is loaded yet.
   *
   * XXXvlab: We could cache the result with result of
   * `connection.getLocalConf()` being the key.
   */
  get customization (): CustomizationAbstract {
    // XXXvlab: Probably don't need a module for that, as the configuration
    // is always re-queried and quite small, we could cache-it in memory.
    let localCfg = this.connection.getLocalConfJSON()
    if (!localCfg) {
      console.log('No local configuration available yet.')
      localCfg = {}
    }
    return this.getCustomization(localCfg)
  }


  /**
   * `wallet` depends on both:
   * - a local configuration (only for the `currencyName`) being
   *   available through a previous call to
   *   `this.connection.getConfJSON(..)`
   * - a loaded endpoint in `this.connection.endpoint` obtained
   *   through `this.endpoint.acquireEndPoint(..)`.
   *
   * XXXvlab: We could cache the result with result of
   * `connection.getLocalConf()` and `this.connection.endpoint` being
   * the keys.
   */
  get wallet (): MessagingWalletAbstract["constructor"] {
    if (!this.ajaxReq) {
      throw Error('a connect() is required before accessing wallet')
    }
    let localCfg: any
    try {
      localCfg = this.customization
    } catch (e) {
      throw Error('A local conf needs to be available before accessing wallet')
    }
    return this.getWallet(
      this.ajaxReq.endpoint.baseUrl,
      localCfg.getCurrencyName(),
      this.customization.getUnlockUrl())
  }


  /**
   * `bcRead` access depends on both:
   * - a local configuration (only for contracts information) being
   *   available through a previous call to
   *   `this.connection.getConfJSON(..)`
   * - a loaded endpoint in `this.connection.endpoint` obtained through
   *   `this.endpoint.acquireEndPoint(..)`.
   *
   * XXXvlab: We could cache the result with result of
   * `connection.getLocalConf()` and `this.connection.endpoint` being
   * the keys.
   */
  get bcRead (): BcReadAbstract {
    if (!this.ajaxReq) {
      throw Error('an init() is required before accessing bcRead')
    }
    let localCfg: any
    try {
      localCfg = this.customization
    } catch (e) {
      throw Error('A local conf needs to be available before accessing wallet')
    }
    return this.getBcRead(
      this.ajaxReq.endpoint.baseUrl,
      [localCfg.getContract1(), localCfg.getContract2()]
    )
  }


  /**
   * `bcTransaction` access depends on both:
   * - a local configuration (only for contracts information) being
   *   available through a previous call to
   *   `this.connection.getConfJSON(..)`
   * - a loaded endpoint in `this.connection.endpoint` obtained through
   *   `this.endpoint.acquireEndPoint(..)`.
   *
   * XXXvlab: We could cache the result with result of
   * `connection.getLocalConf()` and `this.connection.endpoint` being
   * the keys.
   */
  get bcTransaction (): BcTransactionAbstract {
    if (!this.ajaxReq) {
      throw Error('an init() is required before accessing bcTransaction')
    }
    let localCfg: any
    try {
      localCfg = this.customization
    } catch (e) {
      throw Error('A local conf needs to be available before accessing wallet')
    }
    return this.getBcTransaction(
      this.ajaxReq.endpoint.baseUrl,
      [localCfg.getContract1(), localCfg.getContract2()]
    )
  }

}


export default IntegratedJsc3lAbstract
