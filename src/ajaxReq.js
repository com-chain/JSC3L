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

  post (data, callback) {
    this.pendingPosts.push({ data: data, callback: callback })

    if (this.pendingPosts.length === 1) {
      this.queuePost()
    }
  }

  enrollPost (data, callback) {
    Endpoint.post(URL.ENROLL, { data: JSON.stringify(data) })
      .then(function (data) {
        callback(data.data)
      })
  }

  getBalance (addr, callback) {
    this.post({ balance: addr }, callback)
  }

  getTransactionData (addr, callback) {
    this.post({ txdata: addr }, callback)
  }

  sendRawTx (rawtx, additionalData, callback) {
    this.post(Object.assign({}, { rawtx }, additionalData ?? {}), callback)
  }

  getEstimatedGas (txobj, callback) {
    this.post({ estimatedGas: txobj }, callback)
  }

  getEthCall (txobj, callback) {
    this.post({ ethCall: txobj }, callback)
  }

  getEthCallAt (txobj, blockNb, callback) {
    this.post({ ethCallAt: txobj, blockNb: blockNb }, callback)
  }

  queuePost () {
    const data = this.pendingPosts[0].data
    const callback = this.pendingPosts[0].callback

    try {
      Endpoint.post(URL.SERVER, data, this.config).then(data => {
        callback(data.data)
      })
    } catch (err) {
      console.log(err)
    }
    this.pendingPosts.splice(0, 1)
    if (this.pendingPosts.length > 0) { this.queuePost() }
  }

  validateEnrollmentLetter (id, currency, signature, callback) {
    this.enrollPost({ id, currency, signature }, callback)
  }

  enrollAddress (id, address, currency, token, callback) {
    this.enrollPost({ id, addresse: address, token, currency }, callback)
  }

  getTransList (id, count, offset, callback) {
    Endpoint.get(URL.TRANLIST, { addr: id, count, offset })
      .then(function (data) {
        callback(data.data)
      })
  }

  getTransCheck (hash, callback) {
    Endpoint.get(URL.TRANCHECK, { hash })
      .then(function (data) {
        callback(data.data)
      })
  }

  getExportTransList (id, start, end, callback) {
    Endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
      .then(function (data) {
        callback(data.data)
      })
  }

  getExportTransListWithId (id, start, end, callback) {
    Endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
      .then(function (data) {
        callback(data.data, id)
      })
  }

  getCodesFromAddresses (addresses, currency, caller, signature, callback) {
    Endpoint.post(URL.GETCODE, {
      server: currency,
      caller,
      signature,
      addresses
    }).then(function (data) {
      callback(data.data)
    })
  }

  getAddressesFromCode (code, currency, caller, signature, callback) {
    Endpoint.post(URL.GETADDRESS, {
      server: currency,
      caller,
      signature,
      code
    }).then(function (data) {
      callback(data.data)
    })
  }

  getMessageKey (addr, withPrivate, callback) {
    const data = { addr }
    if (withPrivate) data.private = '1'
    Endpoint.get(URL.KEYSTORE, data)
      .then(function (data) {
        callback(data.data)
      })
  }

  publishMessageKey (data, sign, callback) {
    Endpoint.post(URL.KEYSTORE, { data, sign })
      .then(function (data) {
        callback(data.data)
      })
  }

  requestUnlock (address, url, callback) {
    Endpoint.post(url, { address })
      .then(function (data) {
        callback(data)
      })
  }

  getReqMessages (addFrom, addTo, callback) {
    Endpoint.get(URL.requestMessages, { add_req: addFrom, add_cli: addTo })
      .then(function (data) {
        callback(data.data)
      })
  }

  publishReqMessages (data, sign, callback) {
    Endpoint.post(URL.requestMessages, { data, sign })
      .then(function (data) {
        callback(data.data)
      })
  }

  currBlock (callback) {
    Endpoint.get(URL.SERVER)
      .then(function (data) {
        callback(data.data)
      })
  }

  getBlock (hash, callback) {
    Endpoint.get(URL.SERVER, { hash })
      .then(function (data) {
        if (data.data && typeof data.data !== 'object') {
          data.data = JSON.parse(data.data).transaction
        }

        callback(data.data)
      })
  }
}

export default new AjaxReq()
