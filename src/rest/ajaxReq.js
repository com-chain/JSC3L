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

  async enrollPost (data) {
    const res = await Endpoint.post(URL.ENROLL, { data: JSON.stringify(data) })
    return res.data
  }

  getBalance (addr) { return this.post({ balance: addr }) }
  getTransactionData (addr) { return this.post({ txdata: addr }) }
  sendRawTx (rawtx, additionalData) {
    return this.post(Object.assign({}, { rawtx }, additionalData ?? {}))
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

  async getTransList (id, count, offset) {
    const res = await Endpoint.get(URL.TRANLIST, { addr: id, count, offset })
    return res.data
  }

  async getTransCheck (hash) {
    const res = await Endpoint.get(URL.TRANCHECK, { hash })
    return res.data
  }

  async getExportTransList (id, start, end) {
    const res = await Endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
    return res.data
  }

  async getExportTransListWithId (id, start, end) {
    const res = await Endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
    return res.data
  }

  async getCodesFromAddresses (addresses, currency, caller, signature) {
    const res = await Endpoint.post(URL.GETCODE, {
      server: currency,
      caller,
      signature,
      addresses
    })
    return res.data
  }

  async getAddressesFromCode (code, currency, caller, signature) {
    const res = await Endpoint.post(URL.GETADDRESS, {
      server: currency,
      caller,
      signature,
      code
    })
    return res.data
  }

  async getMessageKey (addr, withPrivate) {
    const data = { addr }
    if (withPrivate) data.private = '1'
    const res = await Endpoint.get(URL.KEYSTORE, data)
    return res.data
  }

  async publishMessageKey (data, sign) {
    const res = await Endpoint.post(URL.KEYSTORE, { data, sign })
    return res.data
  }

  async requestUnlock (address, url) {
    return await Endpoint.post(url, { address })
  }

  async getReqMessages (addFrom, addTo) {
    const res = await Endpoint.get(URL.requestMessages, { add_req: addFrom, add_cli: addTo })
    return res.data
  }

  async publishReqMessages (data, sign) {
    const res = await Endpoint.post(URL.requestMessages, { data, sign })
    return res.data
  }

  async currBlock () {
    const res = await Endpoint.get(URL.SERVER)
    return res.data
  }

  async getBlock (hash) {
    const res = await Endpoint.get(URL.SERVER, { hash })
    if (res.data && typeof res.data !== 'object') {
      res.data = JSON.parse(res.data).transaction
    }
    return res.data
  }
}

export default new AjaxReq()
