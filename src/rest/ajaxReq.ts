import { Endpoint } from './endpoint'

class URL {
  static SERVER = 'api.php';
  static ENROLL = 'enroll.php';
  static TRANLIST = 'trnslist.php';
  static TRANCHECK = 'api.php';
  static EXPORTTRAN = 'export.php';
  static GETCODE = 'getuid.php';
  static GETADDRESS = 'getadd.php';
  static KEYSTORE = 'keys.php';
  static requestMessages = 'requestMessages.php';
}

class AjaxReq {
  pendingPosts = []

  post (data) {
    const self = this
    return new Promise(function (resolve, reject) {
      self.pendingPosts.push({ data, resolve, reject })
      if (self.pendingPosts.length === 1) self.queuePost()
    })
  }

  enrollPost (data) {
    return Endpoint.post(URL.ENROLL, { data: JSON.stringify(data) })
  }

  getBalance (addr) { return this.post({ balance: addr }) }
  getTransactionData (addr) { return this.post({ txdata: addr }) }
  async sendTx (rawTx, additionalData) {
    const data: {[k: string]: any} =
      await this.post(Object.assign({}, { rawtx: rawTx }, additionalData ?? {}))

    return {
      isError: !!data.error,
      error: data.error ? data.data : data.msg
    }
  }

  getEstimatedGas (txobj) { return this.post({ estimatedGas: txobj }) }
  getEthCall (txobj) { return this.post({ ethCall: txobj }) }

  getEthCallAt (txobj, blockNb) {
    return this.post({ ethCallAt: txobj, blockNb })
  }

  queuePost () {
    const { data, resolve, reject } = this.pendingPosts[0]

    try {
      Endpoint.post(URL.SERVER, data).then(data => {
        resolve(data.data)
      })
    } catch (err) {
      console.log(err)
      reject(err)
    }
    this.pendingPosts.splice(0, 1)
    if (this.pendingPosts.length > 0) { this.queuePost() }
  }

  validateEnrollmentLetter (id, currency, signature) {
    return this.enrollPost({ id, currency, signature })
  }

  enrollAddress (id, address, currency, token) {
    return this.enrollPost({ id, addresse: address, token, currency })
  }

  getTransList (id, count, offset) {
    return Endpoint.get(URL.TRANLIST, { addr: id, count, offset })
  }

  getTransCheck (hash) {
    return Endpoint.get(URL.TRANCHECK, { hash })
  }

  getExportTransList (id, start, end) {
    return Endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
  }

  getExportTransListWithId (id, start, end) {
    return Endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
  }

  getCodesFromAddresses (addresses, currency, caller, signature) {
    return Endpoint.post(URL.GETCODE, {
      server: currency,
      caller,
      signature,
      addresses
    })
  }

  getAddressesFromCode (code, currency, caller, signature) {
    return Endpoint.post(URL.GETADDRESS, {
      server: currency,
      caller,
      signature,
      code
    })
  }

  getMessageKey (addr, withPrivate) {
    const data: {[k: string]: any} = { addr }
    if (withPrivate) data.private = '1'
    return Endpoint.get(URL.KEYSTORE, data)
  }

  publishMessageKey (data, sign) {
    return Endpoint.post(URL.KEYSTORE, { data, sign })
  }

  requestUnlock (address, url) {
    return Endpoint.post(url, { address })
  }

  getReqMessages (addFrom, addTo) {
    return Endpoint.get(
      URL.requestMessages,
      { add_req: addFrom, add_cli: addTo })
  }

  publishReqMessages (data, sign) {
    return Endpoint.post(URL.requestMessages, { data, sign })
  }

  currBlock () { return Endpoint.get(URL.SERVER) }

  async getBlock (hash) {
    let res = await Endpoint.get(URL.SERVER, { hash })
    if (res && typeof res !== 'object') {
      res = JSON.parse(res).transaction
    }
    return res
  }
}

export default new AjaxReq()
