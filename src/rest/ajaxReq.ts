
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


export default abstract class AjaxReqAbstract {

  // XXXvlab: need to be public only to allow integrated mode (used in
  // ``jsc3l.wallet``)
  public abstract endpoint: any

  pendingPosts = []

  //
  // URL.SERVER POST requests (that are using queuing mecanism)
  //

  post (data) {
    const self = this
    return new Promise(function (resolve, reject) {
      self.pendingPosts.push({ data, resolve, reject })
      if (self.pendingPosts.length === 1) self.queuePost()
    })
  }

  queuePost () {
    const { data, resolve, reject } = this.pendingPosts[0]

    try {
      this.endpoint.post(URL.SERVER, data).then(data => {
        if (data.error) {
          reject(data)
        }
        resolve(data.data)
      })
    } catch (err) {
      console.log(err)
      reject(err)
    }
    this.pendingPosts.splice(0, 1)
    if (this.pendingPosts.length > 0) { this.queuePost() }
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


  //
  // Other calls
  //

  enrollPost (data) {
    return this.endpoint.post(URL.ENROLL, { data: JSON.stringify(data) })
  }

  validateEnrollmentLetter (id, currency, signature) {
    return this.enrollPost({ id, currency, signature })
  }

  enrollAddress (id, address, currency, token) {
    return this.enrollPost({ id, addresse: address, token, currency })
  }

  async getTransList (id, count, offset) {
    // for some strange reasons, the answer is stringified 2 times,
    // so we need to unpack each entry a second time.
    const data = await this.endpoint.get(URL.TRANLIST, { addr: id, count, offset })
    return data.map((dataJSON) => JSON.parse(dataJSON))
  }

  getTransCheck (hash) {
    return this.endpoint.get(URL.TRANCHECK, { hash })
  }

  getExportTransList (id, start, end) {
    return this.endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
  }

  getExportTransListWithId (id, start, end) {
    return this.endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
  }

  getCodesFromAddresses (addresses, currency, caller, signature) {
    return this.endpoint.post(URL.GETCODE, {
      server: currency,
      caller,
      signature,
      addresses
    })
  }

  getAddressesFromCode (code, currency, caller, signature) {
    return this.endpoint.post(URL.GETADDRESS, {
      server: currency,
      caller,
      signature,
      code
    })
  }

  getMessageKey (addr, withPrivate) {
    const data: {[k: string]: any} = { addr }
    if (withPrivate) data.private = '1'
    return this.endpoint.get(URL.KEYSTORE, data)
  }

  publishMessageKey (data, sign) {
    return this.endpoint.post(URL.KEYSTORE, { data, sign })
  }

  requestUnlock (address, url) {
    return this.endpoint.post(url, { address })
  }

  getReqMessages (addFrom, addTo) {
    return this.endpoint.get(
      URL.requestMessages,
      { add_req: addFrom, add_cli: addTo })
  }

  publishReqMessages (data, sign) {
    return this.endpoint.post(URL.requestMessages, { data, sign })
  }

  currBlock () { return this.endpoint.get(URL.SERVER) }

  async getBlock (hash) {
    let res = await this.endpoint.get(URL.SERVER, { hash })
    if (res && typeof res !== 'object') {
      res = JSON.parse(res).transaction
    }
    return res
  }

}

